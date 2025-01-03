import { useLoaderData } from '@remix-run/react';
import { DataFunctionArgs, json as remixJson } from '@remix-run/server-runtime';
import { cloneDeepWith } from 'lodash';
import { superdata } from './superdata';
import { supertag } from './supertag';

type MappedType<TSuper, TPlain> = {
  type: string | (new (...args: any[]) => TSuper);
  toString: (value: TSuper) => TPlain;
  fromString: (value: TPlain) => TSuper;
  tag: string;
};

type JsonObject = Record<string, unknown>;

type SuperObject<T extends JsonObject> = T & { [supertag]: true };

type UnSuperObject<T> = T extends SuperObject<infer R> ? R : never;

export type SuperLoaderFunction<T extends JsonObject> = (
  args: DataFunctionArgs
) => Promise<JsonResponse<SuperObject<T>>>;

/*
 * superdata is used as a hack to preserve the Data type and not collapse into Response
 * it's also helpful for testing as it preseves the data object
 */
type JsonResponse<TData> = Response & { [superdata]: TData };

export type LoaderResult<LoaderFn extends (...args: any[]) => Promise<any>> =
  LoaderFn extends (...args: any[]) => Promise<JsonResponse<infer R>>
    ? R
    : never;

export function mapType<TSuper, TPlain>(
  tag: string,
  toString: (value: TSuper) => TPlain,
  fromString: (value: TPlain) => TSuper
): MappedType<TSuper, TPlain> {
  return {
    type: tag,
    toString,
    fromString,
    tag: `$rsl$${tag}`,
  };
}

type MappedTypes = MappedType<any, any>[];

export const defaultMappedTypes: MappedTypes = [
  mapType(
    'Date',
    (date: Date) => date.toISOString(),
    (str) => new Date(Date.parse(str))
  ),
  mapType(
    'RegExp',
    (exp: RegExp) => [exp.source, exp.flags],
    ([source, flags]) => new RegExp(source, flags)
  ),
  mapType(
    'Map',
    (map: Map<unknown, unknown>) => Array.from(map.entries()),
    (entries) => new Map(entries)
  ),
  mapType(
    'Set',
    (map: Set<unknown>) => Array.from(map.values()),
    (entries) => new Set(entries)
  ),
  mapType(
    'bigint',
    (bigint: bigint) => bigint.toString(),
    (str) => BigInt(str)
  ),
];

function json<Data>(
  data: Data,
  init?: number | ResponseInit
): JsonResponse<Data> {
  return Object.assign(remixJson(data, init), { [superdata]: data });
}

export function encodeSuper<T extends JsonObject>(
  value: T,
  init: number | ResponseInit
): JsonResponse<SuperObject<T>>;
export function encodeSuper<T extends JsonObject>(
  value: T,
  mappedTypes?: MappedTypes,
  init?: number | ResponseInit
): JsonResponse<SuperObject<T>>;
export function encodeSuper<T extends JsonObject>(
  value: T,
  mappedTypesOrInit?: number | ResponseInit | MappedTypes,
  init?: number | ResponseInit
): JsonResponse<SuperObject<T>> {
  if (!Array.isArray(mappedTypesOrInit)) {
    init = mappedTypesOrInit;
    mappedTypesOrInit = undefined;
  }

  const mappedTypes = mappedTypesOrInit ?? defaultMappedTypes;

  return json(
    cloneDeepWith(value, (value) => {
      for (const { type, toString, tag } of mappedTypes) {
        if (
          typeof value === type ||
          (value &&
            typeof value === 'object' &&
            value.constructor.name === type) ||
          Object.prototype.toString.call(value).slice(8, -1) === type
        ) {
          return { [tag]: toString(value as any) };
        }
      }
    }),
    init
  );
}

export function decodeSuper<T extends JsonObject>(
  value: SuperObject<T>,
  mappedTypes = defaultMappedTypes
): UnSuperObject<SuperObject<T>> {
  return cloneDeepWith(value, (value) => {
    for (const { fromString, tag } of mappedTypes) {
      if (value != null && typeof value === 'object' && tag in value) {
        return fromString(value[tag]);
      }
    }
  });
}

export function useSuperLoaderData<
  TLoader extends SuperLoaderFunction<JsonObject>
>(mappedTypes = defaultMappedTypes): UnSuperObject<LoaderResult<TLoader>> {
  const loaderData = useLoaderData<LoaderResult<TLoader>>();
  return decodeSuper(loaderData, mappedTypes);
}

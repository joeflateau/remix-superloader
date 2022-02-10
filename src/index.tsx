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

type LoaderResult<LoaderFn extends (...args: any[]) => Promise<any>> =
  LoaderFn extends (...args: any[]) => Promise<JsonResponse<infer R>>
    ? R
    : never;

export function mapType<TSuper, TPlain>(
  type: string | (new (...args: any[]) => TSuper),
  toString: (value: TSuper) => TPlain,
  fromString: (value: TPlain) => TSuper
): MappedType<TSuper, TPlain> {
  return {
    type,
    toString,
    fromString,
    tag: `$rsl$${typeof type === 'string' ? type : type.name}`,
  };
}

export const defaultMappedTypes: MappedType<any, any>[] = [
  mapType(
    Date,
    (date) => date.toISOString(),
    (str) => new Date(Date.parse(str))
  ),
  mapType(
    RegExp,
    (exp) => [exp.source, exp.flags],
    ([source, flags]) => new RegExp(source, flags)
  ),
  mapType(
    Map,
    (map) => Array.from(map.entries()),
    (entries) => new Map(entries)
  ),
  mapType(
    Set,
    (map) => Array.from(map.values()),
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
  mappedTypes = defaultMappedTypes,
  init?: number | ResponseInit
): JsonResponse<SuperObject<T>> {
  return json(
    cloneDeepWith(value, (value) => {
      for (const { type, toString, tag } of mappedTypes) {
        if (
          (typeof type === 'string' && typeof value === type) ||
          (typeof type !== 'string' && value instanceof type)
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

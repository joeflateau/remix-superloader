import { useLoaderData } from '@remix-run/react';
import { DataFunctionArgs } from '@remix-run/server-runtime';
import { cloneDeepWith } from 'lodash';

type MappedType<TSuper, TPlain> = {
  type: string | (new (...args: any[]) => TSuper);
  toString: (value: TSuper) => TPlain;
  fromString: (value: TPlain) => TSuper;
  tag: string;
};

/*
 * This tag is not actually assigned anywhere, it just helps Typescript tell us if we forgot to
 * call encodeSuper in our loader.
 *
 * If we attempt to decodeSuper/useSuperLoaderData data that was loaded without encodeSuper
 * (if we forgot to encode our loader data). *
 */

const supertag = Symbol('supertag');

type SuperObject<T extends JsonObject> = T & { [supertag]: true };

type UnSuperObject<T> = T extends SuperObject<infer R> ? R : never;

type LoaderFunction<T extends JsonObject> = (
  args: DataFunctionArgs
) => Promise<T>;

type JsonObject = Record<string, unknown>;

type AsyncResult<LoaderFn extends (...args: any[]) => Promise<any>> =
  LoaderFn extends (...args: any[]) => Promise<infer R> ? R : never;

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

export function encodeSuper<T extends JsonObject>(
  value: T,
  mappedTypes = defaultMappedTypes
): SuperObject<T> {
  return cloneDeepWith(value, (value) => {
    for (const { type, toString, tag } of mappedTypes) {
      if (
        (typeof type === 'string' && typeof value === type) ||
        (typeof type !== 'string' && value instanceof type)
      ) {
        return { [tag]: toString(value as any) };
      }
    }
  });
}

export function decodeSuper<T extends JsonObject>(
  value: SuperObject<T>,
  mappedTypes = defaultMappedTypes
): UnSuperObject<T> {
  return cloneDeepWith(value, (value) => {
    for (const { fromString, tag } of mappedTypes) {
      if (value != null && typeof value === 'object' && tag in value) {
        return fromString(value[tag]);
      }
    }
  });
}

export function useSuperLoaderData<
  TLoader extends LoaderFunction<SuperObject<JsonObject>>
>(mappedTypes = defaultMappedTypes): UnSuperObject<AsyncResult<TLoader>> {
  const loaderData = useLoaderData<AsyncResult<TLoader>>();
  return decodeSuper(loaderData, mappedTypes);
}

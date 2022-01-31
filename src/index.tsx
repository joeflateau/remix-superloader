import { useLoaderData } from '@remix-run/react';
import { DataFunctionArgs } from '@remix-run/server-runtime';
import { cloneDeepWith } from 'lodash';

type MappedType<TSuper, TPlain> = {
  type: string | (new (...args: any[]) => TSuper);
  toString: (value: TSuper) => TPlain;
  fromString: (value: TPlain) => TSuper;
  tag: string;
};

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

type PlainObject<T extends Record<string, unknown>> = T;

export function createSuperLoader<T extends Record<string, unknown>>(
  loader: (args: DataFunctionArgs) => Promise<T>,
  mappedTypes = defaultMappedTypes
) {
  function toSuper(value: T): PlainObject<T> {
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

  function fromSuper(value: PlainObject<T>): PlainObject<T> {
    return cloneDeepWith(value, (value) => {
      for (const { fromString, tag } of mappedTypes) {
        if (value != null && typeof value === 'object' && tag in value) {
          return fromString(value[tag]);
        }
      }
    });
  }

  function useSuperLoaderData(): PlainObject<T> {
    const loaderData = useLoaderData();
    return fromSuper(loaderData);
  }

  const wrappedLoader = Object.assign(
    async (args: DataFunctionArgs) => {
      const value = await loader(args);
      return toSuper(value);
    },
    { toSuper, fromSuper, useSuperLoaderData }
  );
  return wrappedLoader;
}

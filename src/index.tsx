import { useLoaderData } from '@remix-run/react';
import { DataFunctionArgs } from '@remix-run/server-runtime';
import { cloneDeepWith } from 'lodash';

function typeMap<TSuper, TPlain>(
  type: new (...args: any[]) => TSuper,
  toString: (value: TSuper) => TPlain,
  fromString: (value: TPlain) => TSuper,
  tag: string
) {
  return { type, toString, fromString, tag };
}

const types = [
  typeMap(
    Date,
    (date) => date.toISOString(),
    (str) => new Date(Date.parse(str)),
    '$date'
  ),
  typeMap(
    RegExp,
    (exp) => [exp.source, exp.flags],
    ([source, flags]) => new RegExp(source, flags),
    '$regex'
  ),
];

type SuperDate = {
  $date: string;
};

type SuperObject<T extends Record<string, unknown>> = {
  [P in keyof T]: T[P] extends Date ? SuperDate : T[P];
};

type PlainObject<T extends Record<string, unknown>> = {
  [P in keyof T]: T[P] extends SuperDate ? Date : T[P];
};

export function toSuper<T extends Record<string, unknown>>(
  value: T
): SuperObject<T> {
  return cloneDeepWith(value, (value) => {
    for (const { type, toString, tag } of types) {
      if (value instanceof type) {
        return { [tag]: toString(value as any) };
      }
    }
  });
}

export function fromSuper<T extends Record<string, unknown>>(
  value: SuperObject<T>
): PlainObject<T> {
  return cloneDeepWith(value, (value) => {
    for (const { fromString, tag } of types) {
      if (value != null && typeof value === 'object' && tag in value) {
        return fromString(value[tag]);
      }
    }
  });
}

export function createSuperLoader<T extends Record<string, unknown>>(
  loader: (args: DataFunctionArgs) => Promise<T>
): (args: DataFunctionArgs) => Promise<SuperObject<T>> {
  return async (args: DataFunctionArgs) => {
    const value = await loader(args);
    return toSuper(value);
  };
}

export function useSuperLoaderData<T extends Record<string, unknown>>(
  loader: (args: DataFunctionArgs) => Promise<SuperObject<T>>
): PlainObject<T> {
  const loaderData = useLoaderData();
  return fromSuper(loaderData);
}

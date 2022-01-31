import { useLoaderData } from '@remix-run/react';
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
      if (typeof value === 'object' && tag in value) {
        return fromString(value[tag]);
      }
    }
  });
}

export async function defineSuperLoader<T extends Record<string, unknown>>(
  loader: () => Promise<T>
): Promise<SuperObject<T>> {
  const value = await loader();
  return toSuper(value);
}

export function useSuperLoaderData<T extends Record<string, unknown>>(
  loader: () => SuperObject<T>
): PlainObject<T> {
  const loaderData = useLoaderData();
  return fromSuper(loaderData);
}

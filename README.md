# remix-superloader

[![CI](https://github.com/joeflateau/remix-superloader/actions/workflows/main.yml/badge.svg)](https://github.com/joeflateau/remix-superloader/actions/workflows/main.yml)
![npm](https://img.shields.io/npm/v/remix-superloader)

Without **remix-superloader**, when you use loaded data with [remix](https://remix.run/)'s `useLoaderData` hook, Date objects (and others) will be strings rather than Date objects due to JSON serialization. You must be sure to parse those back into dates. **remix-superloader** handles parsing/serializing Dates (and Maps, Sets, BigInts, RegExps) so you don't have to think about that. **remix-superloader** also handles inferring types, so the `useSuperLoaderData` hook is automatically properly typed.

## Installation

```shell
npm i remix-superloader
```

## Usage

```tsx
import { useSuperLoaderData, encodeSuper } from 'remix-superloader';

export const loader = async ({ params }: { params: { slug?: string } }) =>
  encodeSuper({
    post: {
      title: 'My first Post',
      date: new Date(),
      slug: params.slug,
    },
  });

export default function Post() {
  const { post } = useSuperLoaderData<typeof loader>();

  // without superloader, post.date is a string
  // with superloader, post.date is a Date

  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.date.toLocaleDateString()}</p>
    </div>
  );
}
```

## Supported types

**remix-superloader** will convert these types that are not able to be represented in standard json for you.

- ✅ Date
- ✅ RegExp
- ✅ Map
- ✅ Set
- ✅ BigInt
- 🚫 Error
- 🚫 undefined

## Advanced: Custom Headers

You can also pass headers (and other ResponseInit data) from your loader

```tsx
import { encodeSuper, useSuperLoaderData } from 'remix-superloader';

const loader = async () =>
  encodeSuper(
    {
      date: new Date(),
    },
    {
      headers: {
        'Server-Timing': serverTiming,
      },
    }
  );

export default function Post() {
  const { date } = useSuperLoaderData<typeof loader>();

  return (
    <div>
      <h2>Hello, {date.toLocaleString()}</h2>
    </div>
  );
}
```

## Advanced: LoaderFunction type

remix-superloader provides a generic alternative to remix's LoaderFunction

```tsx
import {
  encodeSuper,
  useSuperLoaderData,
  SuperLoaderFunction,
} from 'remix-superloader';

const loader: SuperLoaderFunction<{ date: Date }> = async () =>
  encodeSuper(
    {
      date: new Date(),
    },
    {
      headers: {
        'Server-Timing': serverTiming,
      },
    }
  );

export default function Post() {
  const { date } = useSuperLoaderData<typeof loader>();

  return (
    <div>
      <h2>Hello, {date.toLocaleString()}</h2>
    </div>
  );
}
```

## Advanced: Custom Types

You can customize the type converters by including a list of type (de)serializers.

```tsx
import {
  encodeSuper,
  mapType,
  defaultMappedTypes,
  useSuperLoaderData,
} from 'remix-superloader';

class Greeter {
  constructor(public name: string) {}

  greet() {
    return `Hello, ${this.name}`;
  }
}

const customMappedTypes = [
  ...defaultMappedTypes,
  mapType(
    Greeter,
    (greeter) => greeter.name,
    (name) => new Greeter(name)
  ),
];

const loader = async () =>
  encodeSuper(
    {
      greeter: new Greeter('Joe'),
    },
    customMappedTypes
  );

export default function Post() {
  const { greeter } = useSuperLoaderData<typeof loader>(customMappedTypes);

  return (
    <div>
      <h2>{greeter.greet()}</h2>
    </div>
  );
}
```

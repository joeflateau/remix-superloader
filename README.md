# remix-superloader

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

## Advanced: Custom Types

You can customize the type converters by including a list of type (de)serializers.

```tsx
import { encodeSuper, mapType, defaultMappedTypes } from 'remix-superloader';

class MyClass {
  constructor(public name: string) {}

  greet() {
    return `Hello, ${this.name}`;
  }
}

const customMappedTypes = [
  ...defaultMappedTypes,
  mapType(
    MyClass,
    (myInstance) => myInstance.foo,
    (value) => new MyClass(value)
  ),
];

const loader = async () =>
  encodeSuper(
    {
      myInstance: new MyClass('bar'),
    },
    customMappedTypes
  );

export default function Post() {
  const { myInstance } = useSuperLoaderData<typeof loader>(customMappedTypes);

  return (
    <div>
      <h2>{myInstance.greet()}</h2>
    </div>
  );
}
```

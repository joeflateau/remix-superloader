# remix-superloader

Without **remix-superloader**, when you use loaded data with [remix](https://remix.run/)'s  `useLoaderData` hook, Date objects (and others) will be strings rather than Date objects due to JSON serialization. You must be sure to parse those back into dates. **remix-superloader** handles parsing/serializing Dates (and Maps, Sets, BigInts, RegExps) so you don't have to think about that.

## Installation

```shell
npm i remix-superloader
```

## Usage

```tsx
import { createSuperLoader, useSuperLoaderData } from 'remix-superloader';

export const loader = createSuperLoader(
  async ({ params }: { params: { slug?: string } }) => {
    return {
      post: {
        title: "My first Post",
        date: new Date()
      }
    };
  }
);

export default function Post() {
  // we pass a ref to the loader here so useSuperLoaderData can infer types from the loader function
  const { post } = useSuperLoaderData(loader);

  return (
    <div>
      <h2>{post.title}</h2>
      <!-- without super loader, post.date is a ISO8601 format date string
           with super loader, post.date is a real Date object -->
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
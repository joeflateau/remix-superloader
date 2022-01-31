# remix-superloader

Without **remix-superloader** your remix loaders will convert Date objects to ISO Strings and you must be sure to parse those back into dates. **remix-superloader** handles parsing/serializing dates (and regexs) for your remix data loader so you don't have to think about that.

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
  const { post } = useSuperLoaderData(loader);

  return (
    <div>
      <h2>{post.title}</h2>
      <!-- post.date is a real Date object -->
      <p>{post.date.toLocaleDateString()}</p>
    </div>
  );
}
```

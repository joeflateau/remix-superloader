# remix-superloader

## Installation

```shell
npm i remix-superloader
```

## Usage

```tsx
import { createSuperLoader, useSuperLoaderData } from 'remix-superloader';

export const loader = createSuperLoader(
  async ({ params }: { params: { slug?: string } }) => {
    const post = await getWordpressPost(params.slug!);
    return {
      post,
    };
  }
);

export default function Post() {
  const { post } = useSuperLoaderData(loader);

  return <Post post={post} />;
}
```

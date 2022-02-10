/*
 * This tag is not actually assigned anywhere, it just helps Typescript tell us if we forgot to
 * call encodeSuper in our loader.
 *
 * If we attempt to decodeSuper/useSuperLoaderData data that was loaded without encodeSuper
 * (if we forgot to encode our loader data). *
 */
export const supertag = Symbol('supertag');

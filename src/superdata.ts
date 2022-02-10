/*
 * This symbol is used to help pass types through from
 * loader to useLoaderData even though loader actually
 * returns a Response which is not generic
 */
export const superdata = Symbol('superdata');

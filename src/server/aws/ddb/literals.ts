/**
 * these 2 lsis should solve all future lsis. Lsi can be a
 * generic type that has different sk based on the pk.
 * E.g. pkUser can store username in lsi and pkDocument
 * can store id. By lsi being a generic field, can serve
 * the role of multiple lsis.
 */
export const lsi = { name: "lsi", sk: "lsi" } as const;
export const lsi2 = { name: "lsi2", sk: "lsi2" } as const;

export const lsiUsername = {
  name: "username-lsi",
  sk: "username",
} as const;

// better than name
export const lsiNormalized = {
  /** use in index_name */
  name: "normalized-lsi",
  sk: "normalized",
} as const;

// if you intend to upload images, audio, or videos, have this on by default
export const lsiPhash = {
  /** use in index_name */
  name: "phash-lsi",
  sk: "phash",
} as const;

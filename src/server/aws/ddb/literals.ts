/**
 * Generic LSIs (1-5) for flexible querying.
 *
 * DynamoDB allows max 5 LSIs per table. These generic LSIs can store
 * different values per partition key, enabling flexible query patterns.
 *
 * Since LSIs are local to each partition, the same LSI attribute can
 * serve different purposes across partitions.
 *
 * @example
 * // pk="user" partition
 * lsi1: username         - query users by username
 * lsi2: normalized       - query by normalized name for search
 * lsi3: email            - query users by email
 *
 * // pk="media" partition
 * lsi1: type#<createdAt> - filter by type, sort by created
 * lsi2: created#<ts>     - sort by created date
 * lsi3: plays#<count>    - sort by play count
 * lsi4: fingerprint#<h>  - find by perceptual hash
 * lsi5: lastPlayed#<ts>  - sort by last played
 *
 * // pk="image" partition
 * lsi1: phash#<hash>     - find by perceptual hash (dHash)
 * lsi2: created#<ts>     - sort by created date
 */
export const lsi1 = { name: "lsi1", sk: "lsi1" } as const;
export const lsi2 = { name: "lsi2", sk: "lsi2" } as const;
export const lsi3 = { name: "lsi3", sk: "lsi3" } as const;
export const lsi4 = { name: "lsi4", sk: "lsi4" } as const;
export const lsi5 = { name: "lsi5", sk: "lsi5" } as const;

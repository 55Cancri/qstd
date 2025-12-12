export type Email = Record<
  "fromName" | "from" | "subject" | "content" | "to",
  string
> & { textContent?: string };

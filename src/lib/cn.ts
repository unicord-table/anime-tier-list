/** Joins class names, dropping falsy ones. */
export const cn = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

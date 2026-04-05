/** Express 5 / @types/express may type `req.params.x` as `string | string[]`. */
export function paramString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

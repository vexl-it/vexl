export function objectCopyAndOmit<
  T extends Record<string, any>,
  K extends keyof T,
>(obj: T, ...keysToOmit: K[]): Omit<T, K> {
  const result = {...obj}
  keysToOmit.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete result[key]
  })
  return result
}

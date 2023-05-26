export type PathInto<T extends Record<string, any>> = keyof {
  [K in keyof T as T[K] extends string
    ? K
    : T[K] extends Record<string, any>
    ? `${K & string}.${PathInto<T[K]> & string}`
    : never]: any
}

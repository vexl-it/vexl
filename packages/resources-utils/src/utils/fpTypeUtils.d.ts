// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as E from 'fp-ts/Either'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

export type ExtractLeft<T> = T extends E.Left<infer E> ? E : never
export type ExtractRight<T> = T extends E.Right<infer E> ? E : never

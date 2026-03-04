import * as E from 'fp-ts/Either'

export type ExtractLeft<T> = T extends E.Left<infer E> ? E : never
export type ExtractRight<T> = T extends E.Right<infer E> ? E : never

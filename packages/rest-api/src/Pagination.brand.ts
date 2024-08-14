import {Schema} from '@effect/schema'
import {z} from 'zod'

export const PageRequest = z.object({
  page: z.number().int().min(0),
  limit: z.number().int().min(0),
})

export const PageRequestE = Schema.Struct({
  page: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  ),
  limit: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  ),
})

export const PageResponse = z.object({
  nextLink: z.string().nullable(),
  prevLink: z.string().nullable(),
  currentPage: z.number().int().min(0),
  currentPageSize: z.number().int().min(0),
  pagesTotal: z.number().int().min(0),
  itemsCount: z.number().int().min(0),
  itemsCountTotal: z.number().int().min(0),
})

export const PageResponseE = Schema.Struct({
  nextLink: Schema.optional(Schema.String),
  prevLink: Schema.optional(Schema.String),
  currentPage: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  currentPageSize: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  pagesTotal: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  itemsCount: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  itemsCountTotal: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
})

export const MAX_PAGE_SIZE = 2147483647

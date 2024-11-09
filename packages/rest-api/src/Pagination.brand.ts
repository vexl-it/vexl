import {Schema} from 'effect'

export const PageRequest = Schema.Struct({
  page: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  ),
  limit: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  ),
})

export const PageResponse = Schema.Struct({
  nextLink: Schema.Null,
  prevLink: Schema.Null,
  currentPage: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  currentPageSize: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  pagesTotal: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  itemsCount: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  itemsCountTotal: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
})

export const MAX_PAGE_SIZE = 2147483647

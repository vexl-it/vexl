import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {Schema} from 'effect'

const DEFAULT_PAGE_SIZE = 20

export const PageRequest = Schema.Struct({
  page: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0),
    Schema.lessThanOrEqualTo(Number.MAX_SAFE_INTEGER)
  ),
  limit: Schema.optionalWith(
    Schema.NumberFromString.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(0),
      Schema.lessThanOrEqualTo(Number.MAX_SAFE_INTEGER)
    ),
    {default: () => DEFAULT_PAGE_SIZE}
  ),
})

export const PageRequestMeta = Schema.Struct({
  limit: Schema.optionalWith(
    Schema.NumberFromString.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(0),
      Schema.lessThanOrEqualTo(Number.MAX_SAFE_INTEGER)
    ),
    {default: () => DEFAULT_PAGE_SIZE}
  ),
  nextPageToken: Schema.optional(Base64String),
})
export type PageRequestMeta = typeof PageRequestMeta.Type

export const PageResponse = Schema.Struct({
  nextLink: Schema.Null,
  prevLink: Schema.Null,
  currentPage: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  currentPageSize: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  pagesTotal: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  itemsCount: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  itemsCountTotal: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
})

export const PageResponseMeta = Schema.Struct({
  nextPageToken: Schema.NullOr(Base64String),
  hasNext: Schema.Boolean,
  limit: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
})

export const createPageResponse = <A extends Schema.Schema<any>>(
  s: A
): Schema.Struct<
  typeof PageResponseMeta.fields & {items: Schema.Array$<A>}
> => {
  return Schema.Struct({
    ...PageResponseMeta.fields,
    items: Schema.Array(s),
  })
}

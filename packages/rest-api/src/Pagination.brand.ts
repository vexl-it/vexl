import {Schema} from 'effect'

const DEFAULT_PAGE_SIZE = 20

export const PageRequestMeta = Schema.Struct({
  page: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
    // Schema.lessThanOrEqualTo(Number.MAX_SAFE_INTEGER)
  ),
  limit: Schema.optionalWith(
    Schema.NumberFromString.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(0)
      // Schema.lessThanOrEqualTo(Number.MAX_SAFE_INTEGER)
    ),
    {default: () => DEFAULT_PAGE_SIZE}
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

export const PageResponseMeta = Schema.Struct({
  nextLink: Schema.NullOr(Schema.URL),
  prevLink: Schema.optionalWith(Schema.NullOr(Schema.URL), {
    default: () => null,
  }),
  hasNext: Schema.Boolean,
  hasPrev: Schema.optionalWith(Schema.Boolean, {default: () => false}),
  limit: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
})

export const createPageResponse = <A extends Schema.Struct<any>>(
  s: A
): Schema.Struct<
  typeof PageResponseMeta.fields & {items: Schema.Array$<A>}
> => {
  return Schema.Struct({
    ...PageResponseMeta.fields,
    items: Schema.Array(s),
  })
}

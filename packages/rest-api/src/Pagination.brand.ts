import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Effect, Schema} from 'effect'

const DEFAULT_PAGE_SIZE = 20

export const PageRequest = Schema.Struct({
  page: NumberFromString.pipe(
    Schema.check(Schema.isInt()),
    Schema.check(Schema.isGreaterThanOrEqualTo(0)),
    Schema.check(Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER))
  ),
  limit: NumberFromString.pipe(
    Schema.check(Schema.isInt()),
    Schema.check(Schema.isGreaterThanOrEqualTo(0)),
    Schema.check(Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER))
  ).pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => DEFAULT_PAGE_SIZE)),
    Schema.withConstructorDefault(Effect.sync(() => DEFAULT_PAGE_SIZE))
  ),
})

export const PageRequestMeta = Schema.Struct({
  limit: NumberFromString.pipe(
    Schema.check(Schema.isInt()),
    Schema.check(Schema.isGreaterThanOrEqualTo(0)),
    Schema.check(Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER))
  ).pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => DEFAULT_PAGE_SIZE)),
    Schema.withConstructorDefault(Effect.sync(() => DEFAULT_PAGE_SIZE))
  ),
  nextPageToken: Schema.optional(Base64String),
})
export type PageRequestMeta = typeof PageRequestMeta.Type

export const PageResponse = Schema.Struct({
  nextLink: Schema.Null,
  prevLink: Schema.Null,
  currentPage: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  currentPageSize: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  pagesTotal: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  itemsCount: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  itemsCountTotal: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
})

export const PageResponseMeta = Schema.Struct({
  nextPageToken: Schema.NullOr(Base64String),
  hasNext: Schema.Boolean,
  limit: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
})

export const createPageResponse = <A extends Schema.Constraint>(
  s: A
): Schema.Struct<
  typeof PageResponseMeta.fields & {items: Schema.$Array<A>}
> => {
  return Schema.Struct({
    ...PageResponseMeta.fields,
    items: Schema.Array(s),
  })
}

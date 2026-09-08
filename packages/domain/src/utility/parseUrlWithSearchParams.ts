import {Effect, Schema, SchemaIssue, SchemaTransformation} from 'effect'

const ValidUrlOriginString = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((toTest) => {
      try {
        const url = new URL(toTest)
        return url.origin === toTest || url.origin === toTest.replace(/\/$/, '')
          ? true
          : 'Is not valid origin value'
      } catch (error) {
        return error instanceof Error ? error.message : 'Invalid URL'
      }
    })
  )
)

const ValidUrlString = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((toTest) => {
      try {
        // eslint-disable-next-line no-new
        new URL(toTest)
        return true
      } catch (error) {
        return error instanceof Error ? error.message : 'Invalid URL'
      }
    })
  )
)
function parseUrl(stringUrl: string): {
  origin: string
  pathname: string
  searchParams: Record<string, string>
} {
  const url = new URL(stringUrl)
  const {origin, pathname} = url
  const searchParams = Object.fromEntries(url.searchParams.entries())

  return {
    origin,
    pathname,
    searchParams,
  }
}

function stringifyUrl(data: {
  origin: string
  pathname: string
  searchParams: Record<string, string>
}): string {
  const url = new URL(data.pathname, data.origin)
  url.search = new URLSearchParams(data.searchParams).toString()
  return url.toString()
}

const ParsedUrlShape = Schema.Struct({
  origin: ValidUrlOriginString,
  pathname: Schema.String,
  searchParams: Schema.Record(Schema.String, Schema.String),
})

const ParsedUrl = ValidUrlString.pipe(
  Schema.decodeTo(
    ParsedUrlShape,
    SchemaTransformation.transformOrFail({
      decode: (value: string) =>
        Effect.try({
          try: () => parseUrl(value),
          catch: () => new SchemaIssue.InvalidValue({message: 'Invalid URL'}),
        }),
      encode: (value: typeof ParsedUrlShape.Type) =>
        Effect.try({
          try: () => stringifyUrl(value),
          catch: () => new SchemaIssue.InvalidValue({message: 'Invalid URL'}),
        }),
    })
  )
)

export const parseUrlWithSearchParams = <
  A,
  I extends Record<string, string>,
  R,
>(
  paramsShape: Schema.Codec<A, I, R, R>
): Schema.Codec<
  {
    readonly origin: string
    readonly pathname: string
    readonly searchParams: A
  },
  string,
  R,
  R
> =>
  ParsedUrl.pipe(
    Schema.decodeTo(
      Schema.Struct({...ParsedUrlShape.fields, searchParams: paramsShape})
    )
  )

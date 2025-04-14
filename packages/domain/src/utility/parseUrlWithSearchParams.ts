import {ParseResult, Schema} from 'effect'

const ValidUrlOriginString = Schema.String.pipe(
  Schema.filter((toTest, _, ast) => {
    try {
      const url = new URL(toTest)
      return url.origin === toTest || url.origin === toTest.replace(/\/$/, '')
        ? true
        : new ParseResult.Type(ast, toTest, 'Is not valid origin value')
    } catch (e: any) {
      return new ParseResult.Type(ast, toTest, e.message)
    }
  })
)

const ValidUrlString = Schema.String.pipe(
  Schema.filter((toTest, _, ast) => {
    try {
      // eslint-disable-next-line no-new
      new URL(toTest)
      return true
    } catch (e: any) {
      return new ParseResult.Type(ast, toTest, e.message)
    }
  })
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
  searchParams: Schema.Record({key: Schema.String, value: Schema.String}),
})

const ParsedUrl = Schema.transformOrFail(ValidUrlString, ParsedUrlShape, {
  strict: true,
  decode: (s, _, ast) =>
    ParseResult.try({
      try: () => parseUrl(s),
      catch: (e: any) => new ParseResult.Type(ast, s, e.message),
    }),
  encode: (url, _, ast) =>
    ParseResult.try({
      try: () => stringifyUrl(url),
      catch: (e: any) => new ParseResult.Type(ast, url, e.message),
    }),
})

export const parseUrlWithSearchParams = <
  A,
  I extends Record<string, string>,
  R,
>(
  paramsShape: Schema.Schema<A, I, R>
): Schema.Schema<
  {
    readonly origin: string
    readonly pathname: string
    readonly searchParams: A
  },
  string,
  R
> =>
  Schema.compose(
    ParsedUrl,
    Schema.Struct({...ParsedUrlShape.fields, searchParams: paramsShape})
  )

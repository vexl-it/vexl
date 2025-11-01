import {
  InvalidNextPageTokenError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {Array, Effect, Option, type ParseResult, Schema} from 'effect'

export const FetchCommonConnectionsNextPageToken = Schema.Struct({
  lastUserContactId: Schema.Int,
})

function createPaginatedResponse<S extends Schema.Schema.Any, T>({
  dbEffectToRun,
  limit,
  nextPageTokenSchema,
  nextPageToken,
  defaultNextPageToken,
  createNextPageToken,
}: {
  dbEffectToRun: ({
    decodedNextPageToken,
    limit,
  }: {
    decodedNextPageToken: Schema.Schema.Type<S>
    limit: number
  }) => Effect.Effect<
    readonly T[],
    ParseResult.ParseError | UnexpectedServerError
  >
  limit: number
  nextPageTokenSchema: S
  nextPageToken: string | undefined
  defaultNextPageToken: Schema.Schema.Type<S>
  createNextPageToken: (lastItem: T) => Schema.Schema.Type<S>
}): Effect.Effect<
  {
    nextPageToken: string | null
    hasNext: boolean
    limit: number
    items: readonly T[]
  },
  InvalidNextPageTokenError | UnexpectedServerError,
  Schema.Schema.Context<S>
> {
  return Effect.gen(function* (_) {
    if (limit <= 0) {
      return {
        nextPageToken: null,
        hasNext: false,
        limit: 0,
        items: [],
      }
    }

    const increasedLimit = limit + 1
    const decodedNextPageToken = nextPageToken
      ? yield* _(
          base64UrlStringToDecoded({
            base64UrlString: nextPageToken,
            decodeSchema: nextPageTokenSchema,
          })
        )
      : defaultNextPageToken

    const data = yield* _(
      dbEffectToRun({
        limit: increasedLimit,
        decodedNextPageToken,
      })
    )
    const isThereNextPage = data.length === increasedLimit
    const dataToReturn = Array.take(limit)(data)
    const lastElementOfThisPage = Array.last(dataToReturn)
    const newNextPageToken = Option.isSome(lastElementOfThisPage)
      ? yield* _(
          objectToBase64UrlEncoded({
            object: createNextPageToken(lastElementOfThisPage.value),
            schema: nextPageTokenSchema,
          })
        )
      : null

    return {
      nextPageToken: newNextPageToken,
      hasNext: isThereNextPage,
      limit,
      items: dataToReturn,
    }
  }).pipe(
    Effect.catchTag('ParseError', (e) =>
      Effect.fail(
        new InvalidNextPageTokenError({
          cause: e,
        })
      )
    )
  )
}

export default createPaginatedResponse

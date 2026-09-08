import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {Array, Effect, Option, Schema} from 'effect'

export const FetchCommonConnectionsNextPageToken = Schema.Struct({
  lastUserContactId: Schema.Int,
})

function createPaginatedResponse<R, E, S extends Schema.Constraint>({
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
    decodedNextPageToken: S['Type']
    limit: number
  }) => Effect.Effect<readonly R[], E>
  limit: number
  nextPageTokenSchema: S
  nextPageToken: string | undefined
  defaultNextPageToken: S['Type']
  createNextPageToken: (lastItem: R) => S['Type']
}): Effect.Effect<
  {
    nextPageToken: string | null
    hasNext: boolean
    limit: number
    items: readonly R[]
  },
  E | InvalidNextPageTokenError,
  S['DecodingServices'] | S['EncodingServices']
> {
  return Effect.gen(function* () {
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
      ? yield* base64UrlStringToDecoded({
          base64UrlString: nextPageToken,
          decodeSchema: nextPageTokenSchema,
        }).pipe(
          Effect.catchTag('SchemaError', (e) =>
            Effect.fail(
              new InvalidNextPageTokenError({
                cause: e,
              })
            )
          )
        )
      : defaultNextPageToken

    const data = yield* dbEffectToRun({
      limit: increasedLimit,
      decodedNextPageToken,
    })
    const isThereNextPage = data.length === increasedLimit
    const dataToReturn = Array.take(limit)(data)
    const lastElementOfThisPage = Array.last(dataToReturn)
    const newNextPageToken = Option.isSome(lastElementOfThisPage)
      ? yield* objectToBase64UrlEncoded({
          object: createNextPageToken(lastElementOfThisPage.value),
          schema: nextPageTokenSchema,
        }).pipe(
          Effect.catchTag('SchemaError', (e) =>
            Effect.fail(
              new InvalidNextPageTokenError({
                cause: e,
              })
            )
          )
        )
      : null

    return {
      nextPageToken: newNextPageToken,
      hasNext: isThereNextPage,
      limit,
      items: dataToReturn,
    }
  })
}

export default createPaginatedResponse

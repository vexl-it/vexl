import {type Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'

export const getNextPageTokenSchema = <S extends Schema.Schema.Any>(
  schema: S
): ReturnType<
  typeof Schema.compose<
    typeof Schema.StringFromBase64Url,
    ReturnType<typeof Schema.parseJson<S>>
  >
> => {
  return Schema.compose(Schema.StringFromBase64Url, Schema.parseJson(schema))
}

export function base64UrlStringToDecoded<S extends Schema.Schema.Any>({
  base64UrlString,
  decodeSchema,
}: {
  base64UrlString: string
  decodeSchema: S
}): Effect.Effect<Schema.Schema.Type<S>, ParseError, Schema.Schema.Context<S>> {
  return Schema.decode(getNextPageTokenSchema(decodeSchema))(base64UrlString)
}

export function objectToBase64UrlEncoded<S extends Schema.Schema.Any>({
  object,
  schema,
}: {
  object: Schema.Schema.Type<S>
  schema: S
}): Effect.Effect<string, ParseError, Schema.Schema.Context<S>> {
  return Schema.encode(getNextPageTokenSchema(schema))(object)
}

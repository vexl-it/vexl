import {type Effect, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'

export const getNextPageTokenSchema = <S extends Schema.Constraint>(
  schema: S
): Schema.compose<
  Schema.fromJsonString<S>,
  typeof Schema.StringFromBase64Url
> => {
  return Schema.StringFromBase64Url.pipe(
    Schema.decodeTo(Schema.fromJsonString(schema))
  )
}

export function base64UrlStringToDecoded<S extends Schema.Constraint>({
  base64UrlString,
  decodeSchema,
}: {
  base64UrlString: string
  decodeSchema: S
}): Effect.Effect<S['Type'], SchemaError, S['DecodingServices']> {
  return Schema.decodeEffect(getNextPageTokenSchema(decodeSchema))(
    base64UrlString
  )
}

export function objectToBase64UrlEncoded<S extends Schema.Constraint>({
  object,
  schema,
}: {
  object: S['Type']
  schema: S
}): Effect.Effect<string, SchemaError, S['EncodingServices']> {
  return Schema.encodeEffect(getNextPageTokenSchema(schema))(object)
}

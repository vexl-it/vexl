import {Effect, Option, Schema, type SchemaIssue} from 'effect'

export const withDecodingFallback = <S extends Schema.Constraint>(
  schema: S,
  fallback: (issue?: SchemaIssue.Issue) => S['Type']
): Schema.withDecodingDefaultType<
  Schema.middlewareDecoding<S, S['DecodingServices']>
> => {
  const recovered = Schema.catchDecoding<S>((issue) =>
    Effect.sync(() => Option.some(fallback(issue)))
  )(schema)
  return recovered.pipe(
    Schema.withDecodingDefaultType<typeof recovered>(Effect.sync(fallback))
  )
}

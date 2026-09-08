import {Effect, Option, Predicate, Schema, SchemaGetter} from 'effect'

export const optionalNullable = <S extends Schema.Constraint>(
  schema: S
): Schema.decodeTo<
  Schema.optional<Schema.toType<S>>,
  Schema.optional<Schema.NullOr<S>>
> =>
  Schema.optional(Schema.NullOr(schema)).pipe(
    Schema.decodeTo(Schema.optional(Schema.toType(schema)), {
      decode: SchemaGetter.transformOptional<
        S['Type'] | undefined,
        S['Type'] | null | undefined
      >((value) => Option.filter(value, Predicate.isNotNull)),
      encode: SchemaGetter.passthrough(),
    })
  )

export const withNullishDefault = <
  S extends Schema.Constraint & Schema.WithoutConstructorDefault,
>(
  schema: S,
  defaultValue: () => S['Type'] & S['~type.make.in']
): Schema.withConstructorDefault<
  Schema.decodeTo<Schema.toType<S>, Schema.optional<Schema.NullOr<S>>>
> => {
  const decoded = Schema.optional(Schema.NullOr(schema)).pipe(
    Schema.decodeTo(Schema.toType(schema), {
      decode: SchemaGetter.transformOptional<
        S['Type'],
        S['Type'] | null | undefined
      >((value) =>
        value.pipe(
          Option.filter(Predicate.isNotNullish),
          Option.orElseSome(defaultValue)
        )
      ),
      encode: SchemaGetter.required(),
    })
  )
  return decoded.pipe(
    Schema.withConstructorDefault<typeof decoded>(Effect.sync(defaultValue))
  )
}

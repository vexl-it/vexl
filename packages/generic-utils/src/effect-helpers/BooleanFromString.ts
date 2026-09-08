import {Schema, SchemaTransformation} from 'effect'

export const BooleanFromString = Schema.Literals(['true', 'false']).pipe(
  Schema.decodeTo(
    Schema.Boolean,
    SchemaTransformation.transform<boolean, 'true' | 'false'>({
      decode: (value) => value === 'true',
      encode: (value) => (value ? 'true' : 'false'),
    })
  )
)

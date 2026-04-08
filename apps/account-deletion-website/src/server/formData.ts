import {Schema} from 'effect'

export class ErrorParsingFormData extends Schema.TaggedError<ErrorParsingFormData>(
  'ErrorParsingFormData'
)('ErrorParsingFormData', {
  cause: Schema.Unknown,
}) {}

export function decodeFormData<SchemaType extends Schema.Schema.AnyNoContext>(
  schema: SchemaType,
  formData: FormData
): Schema.Schema.Type<SchemaType> {
  try {
    return Schema.decodeUnknownSync(schema)(Object.fromEntries(formData))
  } catch (cause) {
    throw new ErrorParsingFormData({cause})
  }
}

import {Schema} from 'effect'

export class ErrorParsingFormData extends Schema.TaggedError<ErrorParsingFormData>(
  'ErrorParsingFormData'
)('ErrorParsingFormData', {
  cause: Schema.Unknown,
}) {}

export function decodeFormData<SchemaType extends Schema.Decoder<unknown>>(
  schema: SchemaType,
  formData: FormData
): SchemaType['Type'] {
  try {
    return Schema.decodeUnknownSync(schema)(Object.fromEntries(formData))
  } catch (cause) {
    throw new ErrorParsingFormData({cause})
  }
}

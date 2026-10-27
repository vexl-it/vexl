import {Option, Schema} from 'effect'

export class CliError extends Schema.TaggedError<CliError>()('CliError', {
  message: Schema.String,
}) {}

export function fail(message: string): never {
  throw new CliError({message})
}

const SdkError = Schema.Struct({
  name: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  statusCode: Schema.optional(Schema.Number),
  code: Schema.optional(Schema.String),
  details: Schema.optional(Schema.Unknown),
  others: Schema.optional(Schema.Unknown),
  errorText: Schema.optional(Schema.Unknown),
  errorData: Schema.optional(Schema.Unknown),
  data: Schema.optional(Schema.Unknown),
})

export function describeError(error: unknown): typeof SdkError.Type {
  return Option.getOrElse(Schema.decodeUnknownOption(SdkError)(error), () => ({
    message: 'Unrecognized request failure',
  }))
}

export function jsonResponse(value: unknown, accessToken: string): string {
  const json = JSON.stringify(value) ?? 'null'
  return accessToken ? json.replaceAll(accessToken, '[REDACTED]') : json
}

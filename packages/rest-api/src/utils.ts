import {Array, Schema, SchemaTransformation} from 'effect'

export type LoggingFunction = (message?: any, ...optionalParams: any[]) => void

/**
 * Comma separated string <-> deduped array of strings. Meant to be composed
 * with a branded string array schema, e.g. in url params of DELETE requests.
 */
export const CommaSeparatedDedupedStrings = Schema.String.pipe(
  Schema.decodeTo(
    Schema.Array(Schema.String),
    SchemaTransformation.transform<readonly string[], string>({
      decode: (value: string) =>
        value === '' ? [] : Array.dedupe(value.split(',')),
      encode: (values: readonly string[]) => values.join(','),
    })
  )
)

import {Array, Schema} from 'effect'

export type LoggingFunction = (message?: any, ...optionalParams: any[]) => void

/**
 * Comma separated string <-> deduped array of strings. Meant to be composed
 * with a branded string array schema, e.g. in url params of DELETE requests.
 */
export const CommaSeparatedDedupedStrings = Schema.split(',').pipe(
  Schema.compose(
    Schema.transform(Schema.Array(Schema.String), Schema.Array(Schema.String), {
      encode: (a) => a,
      decode: (a) => {
        if (a.length === 1 && a[0] === '') return []

        return Array.dedupe(a)
      },
    })
  )
)

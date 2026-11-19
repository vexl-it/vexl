import {Predicate} from 'effect'

/** Maps API error tags to readable messages. */
export const makeApiErrorMessage =
  (messages: Readonly<Record<string, string>>) =>
  (error: unknown): string => {
    if (
      Predicate.hasProperty(error, '_tag') &&
      Predicate.isString(error._tag)
    ) {
      const message = messages[error._tag]
      if (message) return message
    }
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Request failed'
  }

export const errorToPlainObject = (
  error: Error,
  depth: number = 0
): Record<string, unknown> => {
  if (depth > 4) return {message: '[[truncated]]'}

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause:
      error.cause instanceof Error
        ? errorToPlainObject(error.cause, depth + 1)
        : error.cause,
  }
}

export const makeErrorWithRemovedSensitiveData =
  (removeSensitiveData: (string: string) => string) =>
  (error: Error): Error => {
    const strippedError = new Error(removeSensitiveData(error.message))
    strippedError.name = error.name
    if (error.stack) strippedError.stack = removeSensitiveData(error.stack)
    return strippedError
  }

export const makeErrorJsonWithRemovedSensitiveData =
  (toJsonWithRemovedSensitiveData: (object: unknown) => string) =>
  (error: Error): string =>
    toJsonWithRemovedSensitiveData(errorToPlainObject(error))

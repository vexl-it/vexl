import reportError from './reportError'

/**
 * Location request errors embed the request in the error (urlParams with
 * coordinates or the searched phrase), so the raw error must never be
 * attached to a report. Only the error tag and status code are sent.
 */
export function reportLocationServiceError(
  message: string,
  error: {readonly _tag: string}
): void {
  reportError('warn', new Error(message), {
    errorTag: error._tag,
    status:
      'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined,
  })
}

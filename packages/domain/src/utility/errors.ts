export interface BasicError<NAME extends string> {
  readonly _tag: NAME
  readonly error: Error
  readonly cause?: unknown
}

export type UnknownError = BasicError<'unknownError'>

export function toError<N extends string>(
  name: N,
  message?: string
): (e: unknown) => {_tag: N; error: Error; cause: unknown} {
  return (e: any) =>
    ({
      _tag: name,
      error: new Error(message, {cause: e?.error ? e.error : e}),
      cause: e,
    } as const)
}

export const toBasicError = toError

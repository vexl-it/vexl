export interface BasicError<NAME extends string> {
  _tag: NAME
  error: Error
}

export type UnknownError = BasicError<'unknownError'>

export function toError<N extends string>(
  name: N,
  message?: string
): (e: unknown) => {_tag: N; error: Error} {
  return (e: unknown) =>
    ({
      _tag: name,
      error: new Error(message, {cause: e}),
    } as const)
}

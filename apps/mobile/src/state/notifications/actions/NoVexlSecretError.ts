import {Data} from 'effect'

export class NoVexlSecretError extends Data.TaggedError('NoVexlSecretError')<{
  cause?: unknown
}> {}

import {Data} from 'effect/index'

export class NoVexlSecretError extends Data.TaggedError('NoVexlSecretError')<{
  cause?: unknown
}> {}

import {Schema} from 'effect'

export class ReadingFromStoreError extends Schema.TaggedError<ReadingFromStoreError>(
  'ReadingFromStoreError'
)('ReadingFromStoreError', {
  cause: Schema.Unknown,
}) {}

export class WritingToStoreError extends Schema.TaggedError<WritingToStoreError>(
  'WritingToStoreError'
)('WritingToStoreError', {
  cause: Schema.Unknown,
}) {}

export class ValueNotSet extends Schema.TaggedError<ValueNotSet>('ValueNotSet')(
  'ValueNotSet',
  {}
) {}

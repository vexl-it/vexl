import {NoteId} from '@vexl-next/domain/src/general/notes'
import {Schema} from 'effect'

export class NoteNotFoundError extends Schema.TaggedError<NoteNotFoundError>(
  'NoteNotFoundError'
)('NoteNotFoundError', {
  noteId: NoteId,
}) {}

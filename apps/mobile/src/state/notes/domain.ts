import {OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Effect, Schema} from 'effect'

export const NotesState = Schema.Struct({
  lastUpdatedAt: IsoDatetimeString.pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => MINIMAL_DATE)),
    Schema.withConstructorDefault(Effect.sync(() => MINIMAL_DATE))
  ),
  notesNextPageParam: Schema.optional(Base64String),
  notes: Schema.Array(OneNoteInState).pipe(Schema.mutable),
})
export type NotesState = typeof NotesState.Type

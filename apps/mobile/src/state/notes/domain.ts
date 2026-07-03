import {OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Schema} from 'effect'

export const NotesState = Schema.Struct({
  lastUpdatedAt: Schema.optionalWith(IsoDatetimeString, {
    default: () => MINIMAL_DATE,
  }),
  notesNextPageParam: Schema.optional(Base64String),
  notes: Schema.Array(OneNoteInState).pipe(Schema.mutable),
})
export type NotesState = typeof NotesState.Type

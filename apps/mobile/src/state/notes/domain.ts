import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
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
  // Of the main phone number
  notesNextPageParam: Schema.optional(Base64String),
  // Of every extra phone number, by its identity key
  extraIdentitiesNotesNextPageParam: Schema.optional(
    Schema.Record({key: PublicKeyPemBase64, value: Base64String})
  ),
  notes: Schema.Array(OneNoteInState).pipe(Schema.mutable),
})
export type NotesState = typeof NotesState.Type

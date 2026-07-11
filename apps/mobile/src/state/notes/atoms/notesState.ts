import {type ChatOrigin} from '@vexl-next/domain/src/general/messaging'
import {
  type MyNoteInState,
  type NoteId,
  type OneNoteInState,
} from '@vexl-next/domain/src/general/notes'
import {MINIMAL_DATE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array} from 'effect'
import {atom, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {NotesState} from '../domain'

export const notesStateAtom = atomWithParsedMmkvStorage(
  'notes',
  {
    notesNextPageParam: undefined,
    notes: [],
    lastUpdatedAt: MINIMAL_DATE,
  },
  NotesState,
  'account'
)

export const notesAtom = focusAtom(notesStateAtom, (optic) =>
  optic.prop('notes')
)

export const notesNextPageParamAtom = focusAtom(notesStateAtom, (optic) =>
  optic.prop('notesNextPageParam')
)

export const myNotesAtom = focusAtom(notesAtom, (optic) =>
  optic.filter((note): note is MyNoteInState => !!note.ownershipInfo?.adminId)
)

// Notes from the network only - the user's own notes live under "My notes".
export const othersNotesAtom = focusAtom(notesAtom, (optic) =>
  optic.filter((note) => !note.ownershipInfo?.adminId)
)

export function singleNoteAtom(
  noteId: NoteId | undefined
): FocusAtomType<OneNoteInState | undefined> {
  return focusAtom(notesAtom, (optic) =>
    optic.find((note) => note.noteInfo.noteId === noteId)
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function noteForChatOriginAtom(chatOrigin: ChatOrigin) {
  const singleNoteAtomOrNull =
    chatOrigin.type === 'myNote' || chatOrigin.type === 'theirNote'
      ? singleNoteAtom(chatOrigin.noteId)
      : null
  return atom((get) => {
    if (chatOrigin.type !== 'myNote' && chatOrigin.type !== 'theirNote')
      return undefined

    if (chatOrigin.note) return chatOrigin.note
    return singleNoteAtomOrNull ? get(singleNoteAtomOrNull) : undefined
  })
}

export function isNoteMineAtom(noteId: NoteId | undefined): Atom<boolean> {
  const noteAtom = singleNoteAtom(noteId)
  return atom((get) => {
    const note = get(noteAtom)
    return !!note?.ownershipInfo?.adminId
  })
}

export const areThereAnyNotesAtom = atom((get) => get(notesAtom).length > 0)

export const areThereAnyMyNotesAtom = atom((get) =>
  Array.isNonEmptyArray(get(myNotesAtom))
)

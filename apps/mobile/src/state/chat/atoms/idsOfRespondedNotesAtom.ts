import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {Array} from 'effect'
import {selectAtom} from 'jotai/utils'
import {chatWithMessagesByNoteIdAtom} from './chatWithMessagesForNoteAtom'

const idsOfRespondedNotesAtom = selectAtom(
  chatWithMessagesByNoteIdAtom,
  (chatsByNoteId): NoteId[] => Array.fromIterable(chatsByNoteId.keys()),
  (a, b) => b.join(',') === a.join(',')
)

export default idsOfRespondedNotesAtom

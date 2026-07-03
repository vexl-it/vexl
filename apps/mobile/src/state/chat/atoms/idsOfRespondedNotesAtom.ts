import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {selectAtom} from 'jotai/utils'
import notEmpty from '../../../utils/notEmpty'
import allChatsAtom from './allChatsAtom'

const idsOfRespondedNotesAtom = selectAtom(
  allChatsAtom,
  (allChats): NoteId[] =>
    allChats
      .flat()
      .map((chat) =>
        chat.chat.origin.type === 'theirNote' ? chat.chat.origin.noteId : null
      )
      .filter(notEmpty),
  (a, b) => b.join(',') === a.join(',')
)

export default idsOfRespondedNotesAtom

import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {Array, pipe} from 'effect'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatWithMessages} from '../domain'
import allChatsAtom from './allChatsAtom'

function areNoteChatMapsEqual(
  a: ReadonlyMap<NoteId, ChatWithMessages>,
  b: ReadonlyMap<NoteId, ChatWithMessages>
): boolean {
  return (
    a.size === b.size &&
    pipe(
      Array.fromIterable(a),
      Array.every(([noteId, chat]) => b.get(noteId) === chat)
    )
  )
}

export const chatWithMessagesByNoteIdAtom = selectAtom(
  allChatsAtom,
  (allChats): ReadonlyMap<NoteId, ChatWithMessages> =>
    pipe(
      allChats,
      Array.flatten,
      Array.reduce(new Map<NoteId, ChatWithMessages>(), (byNoteId, chat) => {
        if (
          chat.chat.origin.type === 'theirNote' &&
          !byNoteId.has(chat.chat.origin.noteId)
        )
          byNoteId.set(chat.chat.origin.noteId, chat)
        return byNoteId
      })
    ),
  areNoteChatMapsEqual
)

export default function chatWithMessagesForNoteAtom(
  noteId: NoteId
): Atom<ChatWithMessages | undefined> {
  return selectAtom(chatWithMessagesByNoteIdAtom, (chatsByNoteId) =>
    chatsByNoteId.get(noteId)
  )
}

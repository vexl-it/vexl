import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {HashSet} from 'effect'
import {flow} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import * as O from 'optics-ts'
import {updateChatsPeakCountStatActionAtom} from '../../clubs/atom/clubsWithMembersAtom'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type MessagingState,
} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import focusChatForTheirNoteAtom from './focusChatForTheirNoteAtom'
import {updateMyNotificationTokenInfoInChat} from './generateMyNotificationTokenInfoActionAtom'
import messagingStateAtom from './messagingStateAtom'

function createNewChat({
  inbox,
  initialMessage,
  sentVexlToken,
  note,
}: {
  inbox: Inbox
  initialMessage: ChatMessageWithState
  sentVexlToken?: VexlNotificationToken
  note: OneNoteInState
}): ChatWithMessages {
  const otherSideVersion =
    initialMessage.state === 'receivedButRequiresNewerVersion' ||
    initialMessage.state === 'received'
      ? initialMessage.message.myVersion
      : note.noteInfo.publicPart.authorClientVersion

  const lastReportedVersion =
    initialMessage.state === 'sending' ||
    initialMessage.state === 'sendingError' ||
    initialMessage.state === 'sent'
      ? initialMessage.message.myVersion
      : undefined

  return {
    chat: {
      id: generateChatId(),
      inbox,
      origin: {
        type: 'theirNote',
        noteId: note.noteInfo.noteId,
        note,
      },
      otherSide: {
        publicKey: note.noteInfo.publicPart.notePublicKey,
        clubsIds: [],
      },
      isUnread: false,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      otherSideVexlToken: note.noteInfo.publicPart.vexlNotificationToken,
      otherSideFcmCypher: note.noteInfo.publicPart.vexlNotificationToken,
      lastReportedVexlToken: sentVexlToken,
      showVexlbotNotifications: true,
      lastReportedVersion,
      otherSideVersion,
    },
    tradeChecklist: {
      ...createEmptyTradeChecklistInState(),
    },
    feedbackSubmitted: false,
    hiddenMessagesIds: HashSet.empty(),
    messages: [initialMessage],
  } satisfies ChatWithMessages
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusPrependChatToInbox(publicKey: PublicKeyPemBase64) {
  return O.optic<MessagingState>()
    .find((o) => o.inbox.privateKey.publicKeyPemBase64 === publicKey)
    .prop('chats')
    .prependTo()
}

const upsertChatForTheirNoteActionAtom = atom(
  null,
  (
    get,
    set,
    {
      inbox,
      initialMessage,
      sentVexlNotificationToken,
      note,
    }: {
      inbox: Inbox
      initialMessage: ChatMessageWithState
      sentVexlNotificationToken?: VexlNotificationToken
      note: OneNoteInState
    }
  ) => {
    const existingChatAtom = focusChatForTheirNoteAtom({
      inbox,
      noteInfo: note.noteInfo,
    })
    const existingChat = get(existingChatAtom)

    if (existingChat) {
      set(
        existingChatAtom,
        flow(
          addMessageToChat(initialMessage),
          updateMyNotificationTokenInfoInChat(sentVexlNotificationToken)
        )
      )
      return existingChat.chat
    } else {
      const newChat = createNewChat({
        inbox,
        initialMessage,
        note,
        sentVexlToken: sentVexlNotificationToken,
      })
      set(messagingStateAtom, (old) =>
        O.set(
          focusPrependChatToInbox(
            newChat.chat.inbox.privateKey.publicKeyPemBase64
          )
        )(newChat)(old)
      )

      set(updateChatsPeakCountStatActionAtom, {chat: newChat.chat})

      return newChat.chat
    }
  }
)

export default upsertChatForTheirNoteActionAtom

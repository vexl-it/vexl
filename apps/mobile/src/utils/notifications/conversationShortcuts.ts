import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {
  type AndroidConversationAvatar,
  type ConversationShortcut,
  setConversationShortcuts,
} from '@vexl-next/expo-android-notification-presentation/src'
import {Array, Option, pipe} from 'effect'
import {deepEqual} from 'fast-equals'
import {atom, useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {useEffect} from 'react'
import {Platform} from 'react-native'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../state/chat/domain'
import compareMessages from '../../state/chat/utils/compareMessages'
import chatShouldBeVisible from '../../state/chat/utils/isChatActive'
import {createOpenChatLink} from '../deepLinks/createLinks'
import reportError from '../reportError'

// Launchers show only the first few; the rest still back their notifications.
const MAX_CONVERSATION_SHORTCUTS = 10

export function conversationId({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): string {
  return sha256(inbox + sender)
}

export function toAndroidAvatar(
  image: SvgStringOrImageUri
): AndroidConversationAvatar {
  return image.type === 'svgXml'
    ? {type: 'svgXml', svgXml: image.svgXml.xml}
    : image
}

// Same chats, order, names and avatars as the messages list.
const conversationShortcutsAtom = selectAtom(
  atom((get): ConversationShortcut[] =>
    pipe(
      get(messagingStateAtom),
      Array.flatMap((inbox) => inbox.chats),
      Array.filter(chatShouldBeVisible),
      Array.filterMap((chat) =>
        Option.map(Array.last(chat.messages), (lastMessage) => ({
          chat,
          lastMessage,
        }))
      ),
      Array.sort<{chat: ChatWithMessages; lastMessage: ChatMessageWithState}>(
        (a, b) => compareMessages(b.lastMessage, a.lastMessage)
      ),
      Array.take(MAX_CONVERSATION_SHORTCUTS),
      Array.map(({chat}) => {
        const otherSide = getOtherSideData(chat.chat)
        const keys = {
          inbox: chat.chat.inbox.privateKey.publicKeyPemBase64,
          sender: chat.chat.otherSide.publicKey,
        }
        return {
          id: conversationId(keys),
          name: otherSide.userName,
          avatar: toAndroidAvatar(otherSide.image),
          url: createOpenChatLink(keys),
        }
      })
    )
  ),
  (shortcuts) => shortcuts,
  deepEqual
)

export function useSyncConversationShortcuts(): void {
  const shortcuts = useAtomValue(conversationShortcutsAtom)

  useEffect(() => {
    if (Platform.OS !== 'android') return
    setConversationShortcuts(shortcuts).catch((e) => {
      reportError('warn', new Error('Failed to publish chat shortcuts'), {e})
    })
  }, [shortcuts])
}

import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type OfferInfo} from '@vexl-next/domain/dist/general/offers'
import {useSessionAssumeLoggedIn} from '../../session'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import {useStore} from 'jotai'
import {
  type ChatId,
  generateChatId,
  type Inbox,
} from '@vexl-next/domain/dist/general/messaging'
import * as O from 'optics-ts'
import {
  type ChatMessageWithState,
  type MessagingState,
  type ChatWithMessages,
} from '../domain'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {useCallback} from 'react'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {
  type ApiErrorRequestMessaging,
  sendMessagingRequest,
} from '@vexl-next/resources-utils/dist/chat/sendMessagingRequest'
import messagingStateAtom from '../atoms/messagingStateAtom'

function createNewChat({
  inbox,
  initialMessage,
  offerInfo,
}: {
  inbox: Inbox
  initialMessage: ChatMessageWithState
  offerInfo: OfferInfo
}): ChatWithMessages {
  return {
    chat: {
      id: generateChatId(),
      inbox,
      origin: {type: 'theirOffer', offerId: offerInfo.offerId},
      otherSide: {
        publicKey: offerInfo.publicPart.offerPublicKey,
      },
      isUnread: false,
    },
    messages: [initialMessage],
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusInbox(publicKey: PublicKeyPemBase64) {
  return O.optic<MessagingState>().find(
    (o) => o.inbox.privateKey.publicKeyPemBase64 === publicKey
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusPrependChat(publicKey: PublicKeyPemBase64) {
  return focusInbox(publicKey).prop('chats').prependTo()
}

export default function useSendMessagingRequest(): (a: {
  originOffer: OfferInfo
  text: string
}) => TE.TaskEither<ApiErrorRequestMessaging | ErrorEncryptingMessage, ChatId> {
  const session = useSessionAssumeLoggedIn()
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    ({originOffer, text}) => {
      return pipe(
        sendMessagingRequest({
          text,
          api: api.chat,
          fromKeypair: session.privateKey,
          toPublicKey: originOffer.publicPart.offerPublicKey,
        }),
        TE.map((message) =>
          createNewChat({
            inbox: {privateKey: session.privateKey},
            initialMessage: {state: 'sent', message},
            offerInfo: originOffer,
          })
        ),
        TE.map((chat) => {
          store.set(messagingStateAtom, (old) =>
            O.set(
              focusPrependChat(chat.chat.inbox.privateKey.publicKeyPemBase64)
            )(chat)(old)
          )
          return chat.chat.id
        })
      )
    },
    [api, store, session]
  )
}

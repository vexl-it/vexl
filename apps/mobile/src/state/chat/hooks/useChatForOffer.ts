import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect/index'
import {atom, useAtomValue, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import {useMemo} from 'react'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {sessionDataOrDummyAtom, useSessionAssumeLoggedIn} from '../../session'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {type ChatWithMessages} from '../domain'

interface ChatWithMessagesForOfferIndex {
  readonly myOfferChatsByOfferIdAndPublicKey: ReadonlyMap<
    string,
    ChatWithMessages
  >
  readonly theirOfferChatsByOfferIdAndPublicKey: ReadonlyMap<
    string,
    ChatWithMessages
  >
  readonly oldStateChatsByPublicKey: ReadonlyMap<
    PublicKeyPemBase64,
    ChatWithMessages
  >
}

function createOfferChatKey({
  offerId,
  publicKey,
}: {
  readonly offerId: OfferId
  readonly publicKey: PublicKeyPemBase64
}): string {
  return `${offerId}:${publicKey}`
}

const chatWithMessagesForOfferIndexAtom = atom<ChatWithMessagesForOfferIndex>(
  (get) => {
    const messagingState = get(messagingStateAtom)
    const session = get(sessionDataOrDummyAtom)
    const myOfferChatsByOfferIdAndPublicKey = new Map<
      string,
      ChatWithMessages
    >()
    const theirOfferChatsByOfferIdAndPublicKey = new Map<
      string,
      ChatWithMessages
    >()
    const oldStateChatsByPublicKey = new Map<
      PublicKeyPemBase64,
      ChatWithMessages
    >()

    pipe(
      messagingState,
      Array.forEach((inbox) => {
        Array.forEach(inbox.chats, (chat) => {
          if (inbox.inbox.offerId) {
            myOfferChatsByOfferIdAndPublicKey.set(
              createOfferChatKey({
                offerId: inbox.inbox.offerId,
                publicKey: chat.chat.otherSide.publicKey,
              }),
              chat
            )
          }

          if (inbox.inbox.requestOfferId) {
            theirOfferChatsByOfferIdAndPublicKey.set(
              createOfferChatKey({
                offerId: inbox.inbox.requestOfferId,
                publicKey: chat.chat.otherSide.publicKey,
              }),
              chat
            )
          }

          if (
            inbox.inbox.privateKey.publicKeyPemBase64 ===
            session.privateKey.publicKeyPemBase64
          ) {
            oldStateChatsByPublicKey.set(chat.chat.otherSide.publicKey, chat)
          }
        })
      })
    )

    return {
      myOfferChatsByOfferIdAndPublicKey,
      theirOfferChatsByOfferIdAndPublicKey,
      oldStateChatsByPublicKey,
    }
  }
)

export function chatForPublicKeyAtom({
  inboxPrivateKey,
  otherSidePublicKey,
}: {
  inboxPrivateKey: PrivateKeyPemBase64
  otherSidePublicKey: PublicKeyPemBase64
}): FocusAtomType<Chat | undefined> {
  return focusAtom(messagingStateAtom, (optic) =>
    optic
      .find(
        (one) => one.inbox.privateKey.privateKeyPemBase64 === inboxPrivateKey
      )
      .prop('chats')
      .find((one) => one.chat.otherSide.publicKey === otherSidePublicKey)
      .prop('chat')
  )
}

export function useChatForOffer({
  offerPublicKey,
}: {
  offerPublicKey: PublicKeyPemBase64
}): Chat | undefined {
  const session = useSessionAssumeLoggedIn()

  return useAtomValue(
    useMemo(
      () =>
        chatForPublicKeyAtom({
          inboxPrivateKey: session.privateKey.privateKeyPemBase64,
          otherSidePublicKey: offerPublicKey,
        }),
      [session, offerPublicKey]
    )
  )
}

export function chatWithMessagesForOfferAtom({
  offerId,
  otherSidePublicKey,
  isMyOffer,
}: {
  offerId: OfferId
  otherSidePublicKey: Option.Option<PublicKeyPemBase64>
  isMyOffer: boolean
}): Atom<ChatWithMessages | undefined> {
  const publicKeyOrUndefined = Option.getOrUndefined(otherSidePublicKey)

  return selectAtom(chatWithMessagesForOfferIndexAtom, (chatIndex) => {
    if (!publicKeyOrUndefined) {
      return undefined
    }

    if (isMyOffer) {
      return chatIndex.myOfferChatsByOfferIdAndPublicKey.get(
        createOfferChatKey({
          offerId,
          publicKey: publicKeyOrUndefined,
        })
      )
    }

    return (
      chatIndex.theirOfferChatsByOfferIdAndPublicKey.get(
        createOfferChatKey({
          offerId,
          publicKey: publicKeyOrUndefined,
        })
      ) ?? chatIndex.oldStateChatsByPublicKey.get(publicKeyOrUndefined)
    )
  })
}

export function useChatForOfferExists({
  offerPublicKey,
}: {
  offerPublicKey: PublicKeyPemBase64
}): boolean {
  const session = useSessionAssumeLoggedIn()

  return useAtomValue(
    useMemo(
      () =>
        selectAtom(
          chatForPublicKeyAtom({
            inboxPrivateKey: session.privateKey.privateKeyPemBase64,
            otherSidePublicKey: offerPublicKey,
          }),
          (chat) => !!chat
        ),
      [session, offerPublicKey]
    )
  )
}

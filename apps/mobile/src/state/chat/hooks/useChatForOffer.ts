import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect/index'
import {atom, useAtomValue} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import {useMemo} from 'react'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {sessionDataOrDummyAtom, useSessionAssumeLoggedIn} from '../../session'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {type ChatWithMessages} from '../domain'

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

export function useChatWithMessagesForOffer({
  offerId,
  otherSidePublicKey,
  isMyOffer,
}: {
  offerId: OfferId
  otherSidePublicKey: PublicKeyPemBase64
  isMyOffer: boolean
}): ChatWithMessages | undefined {
  return useAtomValue(
    useMemo(() => {
      return atom((get) => {
        const messagingState = get(messagingStateAtom)

        if (isMyOffer) {
          // My offer always have property offerId
          return pipe(
            messagingState,
            Array.findFirst((inbox) => inbox.inbox.offerId === offerId),
            Option.flatMap((inbox) =>
              Array.findFirst(
                inbox.chats,
                (chat) => chat.chat.otherSide.publicKey === otherSidePublicKey
              )
            ),
            Option.getOrUndefined
          )
        }

        const session = get(sessionDataOrDummyAtom)
        // Old state opened chat from offer id
        const getChatForTheirOfferOldState =
          (): Option.Option<ChatWithMessages> =>
            pipe(
              messagingState,
              Array.findFirst(
                (inbox) =>
                  inbox.inbox.privateKey.publicKeyPemBase64 ===
                  session.privateKey.publicKeyPemBase64
              ),
              Option.flatMap((inbox) =>
                Array.findFirst(
                  inbox.chats,
                  (chat) => chat.chat.otherSide.publicKey === otherSidePublicKey
                )
              )
            )

        // New state opened chat from new inbox and marked it with requestOfferId
        const getChatForTheirOffer = (): Option.Option<ChatWithMessages> =>
          pipe(
            messagingState,
            Array.findFirst((inbox) => inbox.inbox.requestOfferId === offerId),
            Option.flatMap((inbox) =>
              Array.findFirst(
                inbox.chats,
                (chat) => chat.chat.otherSide.publicKey === otherSidePublicKey
              )
            )
          )

        return pipe(
          getChatForTheirOffer(),
          Option.orElse(getChatForTheirOfferOldState),
          Option.getOrUndefined
        )
      })
    }, [offerId, otherSidePublicKey, isMyOffer])
  )
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

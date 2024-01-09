import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {useSessionAssumeLoggedIn} from '../../session'
import {useMemo} from 'react'
import {useAtomValue} from 'jotai'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {selectAtom} from 'jotai/utils'
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
  offerPublicKey,
}: {
  offerPublicKey: PublicKeyPemBase64
}): ChatWithMessages | undefined {
  const session = useSessionAssumeLoggedIn()

  return useAtomValue(
    useMemo(() => {
      const inboxPrivateKey = session.privateKey.privateKeyPemBase64

      return focusAtom(messagingStateAtom, (optic) =>
        optic
          .find(
            (one) =>
              one.inbox.privateKey.privateKeyPemBase64 === inboxPrivateKey
          )
          .prop('chats')
          .find((one) => one.chat.otherSide.publicKey === offerPublicKey)
      )
    }, [session, offerPublicKey])
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

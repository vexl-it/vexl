import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {useSessionAssumeLoggedIn} from '../../session'
import {useMemo} from 'react'
import {chatForPublicKeyAtom} from '../atom'
import {useAtomValue} from 'jotai'
import {type ChatWithMessages} from '../domain'

export function useChatForOffer({
  offerPublicKey,
}: {
  offerPublicKey: PublicKeyPemBase64
}): ChatWithMessages | undefined {
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

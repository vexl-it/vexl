import {
  type Chat,
  type ChatRecoveryProof,
} from '@vexl-next/domain/src/general/messaging'
import {deriveChatRecoveryProof} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {type Getter} from 'jotai'
import {sessionAtom} from '../../session'
import {type ChatWithMessages} from '../domain'
import {isChatRecoveryPending} from './chatRecovery'
import isChatOpen from './isChatOpen'

export function myChatRecoveryProof(
  get: Getter,
  chat: Chat
): ChatRecoveryProof | undefined {
  const session = get(sessionAtom)
  if (session.state !== 'loggedIn') return undefined

  return deriveChatRecoveryProof(session.session.masterSeed, {
    myPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    otherSidePublicKey: chat.otherSide.publicKey,
  })
}

/**
 * Our proof for messages into this chat. Only real chat partners get it,
 * anyone else could use it to fake a recovered chat after a restore.
 */
export function myChatRecoveryProofToShare(
  get: Getter,
  chat: ChatWithMessages
): ChatRecoveryProof | undefined {
  return isChatOpen(chat) && !isChatRecoveryPending(chat)
    ? myChatRecoveryProof(get, chat.chat)
    : undefined
}

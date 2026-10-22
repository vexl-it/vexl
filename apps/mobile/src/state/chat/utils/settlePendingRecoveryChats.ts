import {type ChatRecoveryProof} from '@vexl-next/domain/src/general/messaging'
import {Array, Option, pipe} from 'effect'
import addToSortedArray from '../../../utils/addToSortedArray'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessagesToChats from './addMessagesToChats'
import areMessagesEqual from './areMessagesEqual'
import {consumesHistory} from './chatRecovery'
import compareMessages from './compareMessages'
import {isHiddenMetadataMessage} from './isMetadataMessage'

type SettledChat =
  | {readonly _tag: 'pending'; readonly chat: ChatWithMessages}
  | {readonly _tag: 'recovered'; readonly chat: ChatWithMessages}
  | {readonly _tag: 'rejected'}

function holdMessages(
  chat: ChatWithMessages,
  incoming: readonly ChatMessageWithState[]
): ChatWithMessages {
  return {
    ...chat,
    messages: pipe(
      incoming,
      Array.filter((one) => !isHiddenMetadataMessage(one)),
      Array.reduce(chat.messages, (messages, one) =>
        addToSortedArray(messages, compareMessages, areMessagesEqual)(one)
      )
    ),
  }
}

function historyHasProof({
  incoming,
  proof,
}: {
  incoming: readonly ChatMessageWithState[]
  proof: ChatRecoveryProof | undefined
}): boolean {
  return (
    !!proof &&
    pipe(
      incoming,
      Array.filterMap((one) =>
        one.state === 'received' && one.message.messageType === 'HISTORY'
          ? Option.some(one.message.historyRecoveryProof)
          : Option.none()
      ),
      Array.every((historyProof) => historyProof === proof)
    )
  )
}

function settle({
  chat,
  incoming,
  expectedRecoveryProof,
}: {
  chat: ChatWithMessages
  incoming: readonly ChatMessageWithState[]
  expectedRecoveryProof: ChatRecoveryProof | undefined
}): SettledChat {
  if (!consumesHistory({chat, incoming}))
    return {_tag: 'pending', chat: holdMessages(chat, incoming)}

  if (!historyHasProof({incoming, proof: expectedRecoveryProof}))
    return {_tag: 'rejected'}

  // Held messages are processed only now, as if they just arrived
  return pipe(
    addMessagesToChats([{...chat, messages: []}])([
      ...chat.messages,
      ...incoming,
    ]),
    Array.head,
    Option.match({
      onNone: (): SettledChat => ({_tag: 'rejected'}),
      onSome: (recovered): SettledChat => ({
        _tag: 'recovered',
        chat: recovered,
      }),
    })
  )
}

/**
 * Adds incoming messages to chats waiting for recovery. A chat is recovered
 * once the history we asked for carries the proof we derive for it, which
 * only a real chat partner got from us. Any other history drops the chat.
 */
export default function settlePendingRecoveryChats({
  chats,
  incoming,
  expectedRecoveryProof,
}: {
  chats: readonly ChatWithMessages[]
  incoming: readonly ChatMessageWithState[]
  expectedRecoveryProof: (
    chat: ChatWithMessages
  ) => ChatRecoveryProof | undefined
}): {pending: ChatWithMessages[]; recovered: ChatWithMessages[]} {
  const settled = Array.map(chats, (chat) =>
    settle({
      chat,
      incoming: Array.filter(
        incoming,
        (one) => one.message.senderPublicKey === chat.chat.otherSide.publicKey
      ),
      expectedRecoveryProof: expectedRecoveryProof(chat),
    })
  )

  return {
    pending: Array.filterMap(settled, (one) =>
      one._tag === 'pending' ? Option.some(one.chat) : Option.none()
    ),
    recovered: Array.filterMap(settled, (one) =>
      one._tag === 'recovered' ? Option.some(one.chat) : Option.none()
    ),
  }
}

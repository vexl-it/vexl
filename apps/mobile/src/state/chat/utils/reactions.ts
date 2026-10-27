import {
  type ChatMessageId,
  type ReactionEmoji,
} from '@vexl-next/domain/src/general/messaging'
import {Array, Order, pipe, Record} from 'effect'
import {
  type ChatMessageWithState,
  type ChatReactions,
  type MessageReactions,
} from '../domain'

export function setReaction({
  reactions,
  targetMessageId,
  side,
  emoji,
}: {
  reactions: ChatReactions
  targetMessageId: ChatMessageId
  side: keyof MessageReactions
  emoji: ReactionEmoji | undefined
}): ChatReactions {
  const updated: MessageReactions = {
    ...reactions[targetMessageId],
    [side]: emoji,
  }

  return updated.mine === undefined && updated.theirs === undefined
    ? Record.remove(reactions, targetMessageId)
    : {...reactions, [targetMessageId]: updated}
}

export function applyReceivedReactions(
  reactions: ChatReactions,
  messages: readonly ChatMessageWithState[]
): ChatReactions {
  return pipe(
    messages,
    Array.filter(
      (one): one is Extract<ChatMessageWithState, {state: 'received'}> =>
        one.state === 'received' && one.message.messageType === 'REACTION'
    ),
    Array.sort(
      Order.mapInput(
        Order.number,
        (one: ChatMessageWithState) => one.message.time
      )
    ),
    Array.reduce(reactions, (acc, one) =>
      one.message.reaction
        ? setReaction({
            reactions: acc,
            targetMessageId: one.message.reaction.targetMessageId,
            side: 'theirs',
            emoji: one.message.reaction.emoji,
          })
        : acc
    )
  )
}

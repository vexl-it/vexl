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

function setMessageReactions(
  reactions: ChatReactions,
  targetMessageId: ChatMessageId,
  updated: MessageReactions
): ChatReactions {
  return updated.mine === undefined &&
    updated.theirs === undefined &&
    updated.theirsUpdatedAt === undefined
    ? Record.remove(reactions, targetMessageId)
    : {...reactions, [targetMessageId]: updated}
}

export function setMyReaction({
  reactions,
  targetMessageId,
  emoji,
}: {
  reactions: ChatReactions
  targetMessageId: ChatMessageId
  emoji: ReactionEmoji | undefined
}): ChatReactions {
  return setMessageReactions(reactions, targetMessageId, {
    ...reactions[targetMessageId],
    mine: emoji,
  })
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
    Array.reduce(reactions, (acc, one) => {
      if (!one.message.reaction) return acc
      const {targetMessageId, emoji} = one.message.reaction
      const current = acc[targetMessageId]
      if (
        current?.theirsUpdatedAt !== undefined &&
        one.message.time <= current.theirsUpdatedAt
      )
        return acc

      return setMessageReactions(acc, targetMessageId, {
        ...current,
        theirs: emoji,
        theirsUpdatedAt: one.message.time,
      })
    })
  )
}

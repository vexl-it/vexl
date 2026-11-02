import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  generateChatMessageId,
  ReactionEmoji,
  type ChatMessage,
  type ChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {HashSet, Schema} from 'effect'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessagesToChats from './addMessagesToChats'
import {applyReceivedReactions, setMyReaction} from './reactions'

jest.mock('../../../utils/localization/I18nProvider', () => ({
  getCurrentLocale: () => 'en-US',
}))
jest.mock('./scheduleTradeReminderIfNeeded', () => ({
  scheduleTradeReminderIfNeeded: () => (chat: unknown) => chat,
}))

const otherSide = generatePrivateKey()
const heart = Schema.decodeSync(ReactionEmoji)('❤️')
const thumbsUp = Schema.decodeSync(ReactionEmoji)('👍')
const targetMessageId = generateChatMessageId()

function receivedReaction({
  emoji,
  time,
  target = targetMessageId,
}: {
  emoji: ReactionEmoji | undefined
  time: number
  target?: ChatMessageId
}): ChatMessageWithState {
  return {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      messageType: 'REACTION',
      senderPublicKey: otherSide.publicKeyPemBase64,
      text: '',
      time: Schema.decodeSync(UnixMilliseconds)(time),
      reaction: {targetMessageId: target, emoji},
    },
  }
}

function receivedTextMessage(): ChatMessageWithState {
  const message: ChatMessage = {
    uuid: targetMessageId,
    messageType: 'MESSAGE',
    senderPublicKey: otherSide.publicKeyPemBase64,
    text: 'hello',
    time: Schema.decodeSync(UnixMilliseconds)(1),
  }
  return {state: 'received', message}
}

function chatWithMessages(): ChatWithMessages {
  return {
    chat: {
      id: generateChatId(),
      inbox: {privateKey: generatePrivateKey()},
      otherSide: {publicKey: otherSide.publicKeyPemBase64},
      origin: {type: 'unknown'},
      isUnread: false,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      showVexlbotNotifications: true,
    },
    messages: [],
    hiddenMessagesIds: HashSet.empty(),
    tradeChecklist: {
      dateAndTime: {},
      location: {},
      amount: {},
      network: {},
      identity: {},
      contact: {},
    },
    feedbackSubmitted: false,
    reactions: {},
  }
}

describe('setMyReaction', () => {
  it('drops the entry once my reaction is removed and there is nothing else', () => {
    const withMine = setMyReaction({
      reactions: {},
      targetMessageId,
      emoji: heart,
    })
    expect(withMine[targetMessageId]).toEqual({mine: heart})

    expect(
      setMyReaction({reactions: withMine, targetMessageId, emoji: undefined})
    ).toEqual({})
  })
})

describe('applyReceivedReactions', () => {
  it('applies received reactions in time order regardless of arrival order', () => {
    const reactions = applyReceivedReactions({}, [
      receivedReaction({emoji: heart, time: 3}),
      receivedReaction({emoji: thumbsUp, time: 2}),
    ])

    expect(reactions[targetMessageId]?.theirs).toBe(heart)
  })

  it('removes the reaction when the latest one has no emoji', () => {
    const reactions = applyReceivedReactions({}, [
      receivedReaction({emoji: heart, time: 1}),
      receivedReaction({emoji: undefined, time: 2}),
    ])

    expect(reactions[targetMessageId]?.theirs).toBeUndefined()
  })

  it('ignores an older reaction arriving in a later fetch', () => {
    const afterFirstFetch = applyReceivedReactions({}, [
      receivedReaction({emoji: thumbsUp, time: 2}),
    ])
    const afterSecondFetch = applyReceivedReactions(afterFirstFetch, [
      receivedReaction({emoji: heart, time: 1}),
    ])

    expect(afterSecondFetch[targetMessageId]?.theirs).toBe(thumbsUp)
  })
})

describe('addMessagesToChats', () => {
  it('stores reactions without adding them to messages or marking the chat unread', () => {
    const [updated] = addMessagesToChats([chatWithMessages()])([
      receivedReaction({emoji: heart, time: 2}),
    ])

    expect(updated?.messages).toEqual([])
    expect(updated?.chat.isUnread).toBe(false)
    expect(updated?.reactions[targetMessageId]?.theirs).toBe(heart)
  })

  it('still marks the chat unread when a real message arrives with a reaction', () => {
    const [updated] = addMessagesToChats([chatWithMessages()])([
      receivedTextMessage(),
      receivedReaction({emoji: heart, time: 2}),
    ])

    expect(updated?.messages.map((one) => one.message.messageType)).toEqual([
      'MESSAGE',
    ])
    expect(updated?.chat.isUnread).toBe(true)
  })
})

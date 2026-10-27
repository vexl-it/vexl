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
import {applyReceivedReactions, setReaction} from './reactions'

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

describe('setReaction', () => {
  it('keeps both sides and drops the entry once both are removed', () => {
    const withBoth = setReaction({
      reactions: setReaction({
        reactions: {},
        targetMessageId,
        side: 'mine',
        emoji: heart,
      }),
      targetMessageId,
      side: 'theirs',
      emoji: thumbsUp,
    })
    expect(withBoth[targetMessageId]).toEqual({mine: heart, theirs: thumbsUp})

    const withoutMine = setReaction({
      reactions: withBoth,
      targetMessageId,
      side: 'mine',
      emoji: undefined,
    })
    expect(withoutMine[targetMessageId]).toEqual({
      mine: undefined,
      theirs: thumbsUp,
    })

    const withoutAny = setReaction({
      reactions: withoutMine,
      targetMessageId,
      side: 'theirs',
      emoji: undefined,
    })
    expect(withoutAny).toEqual({})
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

    expect(reactions).toEqual({})
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

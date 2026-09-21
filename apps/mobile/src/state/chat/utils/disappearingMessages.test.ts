import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  DisappearingTimerSeconds,
  generateChatId,
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {HashSet, Schema} from 'effect'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from './addMessageToChat'
import {splitExpiredMessages} from './disappearingMessages'

const senderPublicKey = generatePrivateKey().publicKeyPemBase64
const oneHour = Schema.decodeSync(DisappearingTimerSeconds)(60 * 60)
const HOUR_MS = 60 * 60 * 1000

const emptyChat: ChatWithMessages = {
  chat: {
    id: generateChatId(),
    inbox: {privateKey: generatePrivateKey()},
    otherSide: {publicKey: senderPublicKey},
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
}

function message(
  overrides: Partial<ChatMessage>,
  state: 'received' | 'sent' | 'sending' = 'received'
): ChatMessageWithState {
  return {
    state,
    message: {
      uuid: generateChatMessageId(),
      text: 'Message',
      time: Schema.decodeSync(UnixMilliseconds)(0),
      messageType: 'MESSAGE',
      senderPublicKey,
      ...overrides,
    },
  }
}

describe('disappearing messages', () => {
  it('removes only messages whose timer ran out', () => {
    const expired = message({disappearingTimer: oneHour})
    const withoutTimer = message({})
    const timerUpdate = message({
      messageType: 'DISAPPEARING_MESSAGES_UPDATE',
      disappearingTimer: oneHour,
    })
    const chat = {
      ...emptyChat,
      messages: [expired, withoutTimer, timerUpdate],
    }

    expect(splitExpiredMessages(chat, HOUR_MS - 1).chat).toBe(chat)

    const result = splitExpiredMessages(chat, HOUR_MS)
    expect(result.expired).toEqual([expired])
    expect(result.chat.messages).toEqual([withoutTimer, timerUpdate])
  })

  it('syncs the chat timer from delivered timer updates only', () => {
    const update = (
      state: 'received' | 'sent' | 'sending',
      disappearingTimer?: DisappearingTimerSeconds
    ): ChatMessageWithState =>
      message(
        {messageType: 'DISAPPEARING_MESSAGES_UPDATE', disappearingTimer},
        state
      )

    const pending = addMessageToChat(update('sending', oneHour))(emptyChat)
    expect(pending.chat.disappearingTimer).toBeUndefined()

    const enabled = addMessageToChat(update('received', oneHour))(pending)
    expect(enabled.chat.disappearingTimer).toBe(oneHour)

    const disabled = addMessageToChat(update('sent'))(enabled)
    expect(disabled.chat.disappearingTimer).toBeUndefined()
  })
})

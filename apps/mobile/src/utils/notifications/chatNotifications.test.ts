import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatOrigin,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {NoteId, OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {
  FriendLevel,
  OfferId,
  OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type en} from '@vexl-next/localization/src/translations'
import {Schema} from 'effect'
import {scheduleNotificationAsync} from 'expo-notifications'
import {type createInstance} from 'i18next'
import {getDefaultStore, type atom} from 'jotai'
import {Platform} from 'react-native'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {
  dummyChatWithMessages,
  type ChatMessageWithState,
  type ChatWithMessages,
  type ReceivedMessage,
} from '../../state/chat/domain'
import {offersAtom} from '../../state/marketplace/atoms/offersState'
import {notesAtom} from '../../state/notes/atoms/notesState'
import {showChatNotification} from './chatNotifications'
import {getChatNotificationName} from './getChatNotificationName'
import {scheduleTradeReminder} from './tradeReminderNotifications'

jest.mock('react-native-mmkv')
jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('../reportError', () => ({__esModule: true, default: jest.fn()}))
jest.mock('../useAppState', () => ({useAppState: jest.fn()}))
jest.mock('../localization/I18nProvider', () => {
  const jotai = jest.requireActual<{atom: typeof atom}>('jotai')
  const i18next = jest.requireActual<{
    createInstance: typeof createInstance
  }>('i18next')
  const translations = jest.requireActual<{en: typeof en}>(
    '@vexl-next/localization/src/translations'
  )
  const i18n = i18next.createInstance({
    lng: 'en',
    resources: {en: {translation: translations.en}},
    keySeparator: false,
    interpolation: {escapeValue: false},
  })
  void i18n.init()
  return {translationAtom: jotai.atom({t: i18n.t.bind(i18n)})}
})
jest.mock('../localization/formattingLocaleAtom', () => {
  const jotai = jest.requireActual<{atom: typeof atom}>('jotai')
  return {formattingLocaleAtom: jotai.atom('en-US')}
})
jest.mock('expo-notifications', () => ({
  AndroidImportance: {DEFAULT: 3, HIGH: 4},
  AndroidNotificationPriority: {HIGH: 'high'},
  SchedulableTriggerInputTypes: {DATE: 'date'},
  getPresentedNotificationsAsync: jest.fn(async () => []),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
}))

const store = getDefaultStore()
const senderPublicKey = generatePrivateKey().publicKeyPemBase64
const offerId = Schema.decodeSync(OfferId)('notification-test-offer')
const noteId = Schema.decodeSync(NoteId)('00000000-0000-4000-8000-000000000001')

function message(
  messageType: MessageType,
  friendLevel?: readonly FriendLevel[]
): typeof ReceivedMessage.Type {
  return {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      time: Schema.decodeSync(UnixMilliseconds)(Date.now()),
      senderPublicKey,
      messageType,
      text: messageType === 'MESSAGE' ? 'See you tomorrow' : '',
      friendLevel,
    },
  }
}

function chat(
  messages: ChatMessageWithState[],
  origin: ChatOrigin = {type: 'myOffer', offerId}
): ChatWithMessages {
  return {
    ...dummyChatWithMessages,
    chat: {
      ...dummyChatWithMessages.chat,
      origin,
      otherSide: {publicKey: senderPublicKey},
    },
    messages,
  }
}

async function notify(
  chatWithMessages: ChatWithMessages,
  newMessage: ChatMessageWithState
): Promise<void> {
  await showChatNotification({
    newMessage,
    inbox: {inbox: chatWithMessages.chat.inbox, chats: [chatWithMessages]},
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.replaceProperty(Platform, 'OS', 'ios')
  store.set(messagingStateAtom, [])
  store.set(notesAtom, [])
  store.set(offersAtom, [])
})
afterAll(() => {
  jest.restoreAllMocks()
})

it.each<{friendLevel: FriendLevel; name: string}>([
  {friendLevel: 'FIRST_DEGREE', name: 'Direct friend'},
  {friendLevel: 'SECOND_DEGREE', name: 'Friend of a friend'},
  {friendLevel: 'CLUB', name: 'Club member'},
])('uses $name in an iOS message notification', async ({friendLevel, name}) => {
  const newMessage = message('MESSAGE')
  await notify(
    chat([message('REQUEST_MESSAGING', [friendLevel]), newMessage]),
    newMessage
  )
  expect(scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({title: name, body: 'See you tomorrow'}),
    })
  )
})

it('uses the most recent received request, ignoring requests we sent', () => {
  const chatWithMessages = chat([
    message('REQUEST_MESSAGING', ['FIRST_DEGREE']),
    message('REQUEST_MESSAGING', ['SECOND_DEGREE']),
    {...message('REQUEST_MESSAGING', ['FIRST_DEGREE']), state: 'sent'},
  ])
  expect(getChatNotificationName(store.get, chatWithMessages)).toBe(
    'Friend of a friend'
  )
})

it('preserves a revealed name over the relationship label', async () => {
  const newMessage = message('MESSAGE')
  const initialChat = chat([
    message('REQUEST_MESSAGING', ['FIRST_DEGREE']),
    newMessage,
  ])
  const chatWithMessages: ChatWithMessages = {
    ...initialChat,
    chat: {
      ...initialChat.chat,
      otherSide: {
        ...initialChat.chat.otherSide,
        realLifeInfo: {
          ...getOtherSideData(initialChat.chat),
          userName: Schema.decodeSync(UserName)('Alice'),
        },
      },
    },
  }
  await notify(chatWithMessages, newMessage)
  expect(scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({title: 'Alice'}),
    })
  )
})

it('preserves the anonymous fallback when the relationship is unknown', () => {
  const chatWithMessages = chat([
    message('REQUEST_MESSAGING', ['NOT_SPECIFIED']),
  ])
  expect(getChatNotificationName(store.get, chatWithMessages)).toBe(
    getOtherSideData(chatWithMessages.chat).userName
  )
})

it('uses the note relationship for outgoing chats without a received request', () => {
  const note = Schema.decodeUnknownSync(OneNoteInState)({
    noteInfo: {
      id: 1,
      noteId,
      privatePart: {
        commonFriends: [],
        friendLevel: ['SECOND_DEGREE'],
        symmetricKey: 'test-key',
      },
      publicPart: {
        notePublicKey: senderPublicKey,
        text: 'Test',
        allowRepost: true,
      },
      expiresAt: Date.now() + 100000,
      createdAt: '2026-09-04T00:00:00.000Z',
      modifiedAt: '2026-09-04T00:00:00.000Z',
    },
    flags: {},
  })
  store.set(notesAtom, [note])
  expect(
    getChatNotificationName(store.get, chat([], {type: 'theirNote', noteId}))
  ).toBe('Friend of a friend')
})

it('uses the relationship in Android MessagingStyle sender data', async () => {
  jest.replaceProperty(Platform, 'OS', 'android')
  const newMessage = message('MESSAGE')
  await notify(
    chat([message('REQUEST_MESSAGING', ['FIRST_DEGREE']), newMessage]),
    newMessage
  )
  expect(scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        title: 'Direct friend',
        data: expect.objectContaining({
          androidConversation: expect.objectContaining({
            senderName: 'Direct friend',
          }),
        }),
      }),
    })
  )
})

it('preserves the generic messaging request copy', async () => {
  const request = message('REQUEST_MESSAGING', ['SECOND_DEGREE'])
  await notify(chat([request]), request)
  expect(scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        title: 'New response to your offer',
        body: 'Someone wants to connect with you.',
      }),
    })
  )
})

it('reads request history when scheduling a trade reminder from a Chat', async () => {
  const chatWithMessages = chat([
    message('REQUEST_MESSAGING', ['FIRST_DEGREE']),
  ])
  store.set(messagingStateAtom, [
    {inbox: chatWithMessages.chat.inbox, chats: [chatWithMessages]},
  ])
  await scheduleTradeReminder({
    chat: chatWithMessages.chat,
    meetingTime: Schema.decodeSync(UnixMilliseconds)(Date.now() + 3600000),
  })
  expect(scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        title: 'Meeting with Direct friend',
      }),
    })
  )
})

it('uses the relationship in trade checklist notification copy', async () => {
  const newMessage = message('TRADE_CHECKLIST_UPDATE')
  await notify(
    chat([message('REQUEST_MESSAGING', ['SECOND_DEGREE']), newMessage]),
    newMessage
  )
  expect(scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        title: 'Friend of a friend',
        body: 'Friend of a friend updated the trade checklist.',
      }),
    })
  )
})

it('uses the offer relationship for an outgoing chat and prefers its archived copy', () => {
  const offer = Schema.decodeUnknownSync(OneOfferInState)({
    offerInfo: {
      id: 1,
      offerId,
      createdAt: '2026-09-04T00:00:00.000Z',
      modifiedAt: '2026-09-04T00:00:00.000Z',
      privatePart: {
        commonFriends: [],
        friendLevel: ['CLUB'],
        symmetricKey: 'test-key',
      },
      publicPart: {
        offerPublicKey: senderPublicKey,
        location: [],
        offerDescription: 'Test',
        amountBottomLimit: 10,
        amountTopLimit: 100,
        feeState: 'WITHOUT_FEE',
        feeAmount: 0,
        locationState: [],
        paymentMethod: [],
        btcNetwork: [],
        currency: 'USD',
        spokenLanguages: [],
        offerType: 'SELL',
        activePriceState: 'NONE',
        activePriceValue: 0,
        activePriceCurrency: 'USD',
        active: true,
        groupUuids: [],
      },
    },
    flags: {},
  })
  store.set(offersAtom, [offer])
  expect(
    getChatNotificationName(store.get, chat([], {type: 'theirOffer', offerId}))
  ).toBe('Club member')
  const archivedOffer = {
    ...offer,
    offerInfo: {
      ...offer.offerInfo,
      privatePart: {
        ...offer.offerInfo.privatePart,
        friendLevel: Schema.decodeSync(Schema.Array(FriendLevel))([
          'FIRST_DEGREE',
        ]),
      },
    },
  }
  expect(
    getChatNotificationName(
      store.get,
      chat([], {type: 'theirOffer', offerId, offer: archivedOffer})
    )
  ).toBe('Direct friend')
})

import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {Schema} from 'effect'
import {createStore} from 'jotai'
import {setParentChatActionAtom} from './fromChatAtoms'
import {
  areThereUpdatesToBeSentAtom,
  updatesToBeSentAtom,
} from './updatesToBeSentAtom'

jest.mock('../../chat/atoms/focusChatWithMessagesAtom', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    __esModule: true,
    default: ({chatId}: {chatId: unknown}) =>
      createAtom({
        chat: {id: chatId},
      }),
  }
})

jest.mock('../../chat/domain', () => ({
  dummyChatWithMessages: {
    chat: {id: 'dummy-chat'},
  },
}))

jest.mock('../../marketplace/atoms/offersState', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    offerForChatOriginAtom: () => createAtom(undefined),
  }
})

jest.mock('../utils/amount', () => ({
  getLatestAmountDataMessage: () => undefined,
}))

const chatAId = Schema.decodeUnknownSync(ChatId)('chat-a')
const chatBId = Schema.decodeUnknownSync(ChatId)('chat-b')
const inboxKey = Schema.decodeUnknownSync(PublicKeyPemBase64)('inbox-key')
const stagedUpdates = Schema.decodeUnknownSync(TradeChecklistUpdate)({
  identity: {
    status: 'REQUEST_REVEAL',
    timestamp: 1,
  },
})

test('clears staged updates when the parent chat changes', () => {
  const store = createStore()

  store.set(setParentChatActionAtom, {chatId: chatAId, inboxKey})
  store.set(updatesToBeSentAtom, stagedUpdates)
  store.set(setParentChatActionAtom, {chatId: chatBId, inboxKey})

  expect(store.get(areThereUpdatesToBeSentAtom)).toBe(false)
})

test('keeps staged updates when setting the same parent chat', () => {
  const store = createStore()

  store.set(setParentChatActionAtom, {chatId: chatAId, inboxKey})
  store.set(updatesToBeSentAtom, stagedUpdates)
  store.set(setParentChatActionAtom, {chatId: chatAId, inboxKey})

  expect(store.get(areThereUpdatesToBeSentAtom)).toBe(true)
  expect(store.get(updatesToBeSentAtom)).toEqual(stagedUpdates)
})

import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Schema} from 'effect/index'
import {createStore, type WritableAtom} from 'jotai'
import {
  dummyChatWithMessages,
  type ChatWithMessages,
} from '../../../state/chat/domain'
import {chatWithMessagesAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  exchangeDetailsPhotoUriAtom,
  exchangeDetailsSelectionAtom,
  toggleExchangeDetailActionAtom,
} from './exchangeDetailsAtoms'

const mockSelectImage = jest.fn(
  (_targetAtom: WritableAtom<unknown, [UriString], unknown>) => undefined
)

jest.mock('../../../state/selectImageActionAtom', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  return {
    selectImageActionAtom: createAtom(
      null,
      (
        _get: unknown,
        _set: unknown,
        targetAtom: WritableAtom<unknown, [UriString], unknown>
      ) => {
        mockSelectImage(targetAtom)
      }
    ),
  }
})

jest.mock('../../../state/tradeChecklist/atoms/fromChatAtoms', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  const {dummyChatWithMessages: dummyChat} = jest.requireActual(
    '../../../state/chat/domain'
  )
  return {
    chatWithMessagesAtom: createAtom(dummyChat),
  }
})

jest.mock('../../../state/session', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  return {sessionDataOrDummyAtom: createAtom({phoneNumber: '+420777111222'})}
})

jest.mock('../../../state/session/userDataAtoms', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  return {
    invalidUsernameUIFeedbackAtom: createAtom(null, () => undefined),
    realUserImageAtom: createAtom(undefined),
    realUserNameAtom: createAtom(undefined),
  }
})

jest.mock('./updatesToBeSentAtom', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  return {
    submitTradeChecklistUpdatesActionAtom: createAtom(null, () => undefined),
  }
})

const PHOTO_URI = Schema.decodeSync(UriString)('file:///picked-photo.jpg')
const EXISTING_PHOTO_URI = Schema.decodeSync(UriString)(
  'file:///existing-photo.jpg'
)
const PHOTO_ONLY_VERSION = Schema.decodeSync(VersionString)('26.9.5')
const LEGACY_VERSION = Schema.decodeSync(VersionString)('26.9.4')

function chatWithOtherSideVersion(
  otherSideVersion: VersionString | undefined
): ChatWithMessages {
  return {
    ...dummyChatWithMessages,
    chat: {
      ...dummyChatWithMessages.chat,
      otherSideVersion,
    },
  }
}

beforeEach(() => {
  mockSelectImage.mockReset()
})

describe('toggleExchangeDetailActionAtom', () => {
  it('opens the image picker without ticking photo when no photo is set, then ticks photo once picked', () => {
    const store = createStore()
    store.set(
      chatWithMessagesAtom,
      chatWithOtherSideVersion(PHOTO_ONLY_VERSION)
    )

    store.set(toggleExchangeDetailActionAtom, 'photo')

    expect(mockSelectImage).toHaveBeenCalledTimes(1)
    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: false,
      phoneNumber: false,
      photo: false,
    })
    expect(store.get(exchangeDetailsPhotoUriAtom)).toBeUndefined()

    const targetAtom = mockSelectImage.mock.calls[0]?.[0]
    expect(targetAtom).toBeDefined()
    if (!targetAtom) return

    store.set(targetAtom, PHOTO_URI)

    expect(store.get(exchangeDetailsPhotoUriAtom)).toBe(PHOTO_URI)
    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: false,
      phoneNumber: false,
      photo: true,
    })
  })

  it('also ticks nickname once a photo is picked when the other side requires a nickname with a photo', () => {
    const store = createStore()
    store.set(chatWithMessagesAtom, chatWithOtherSideVersion(LEGACY_VERSION))

    store.set(toggleExchangeDetailActionAtom, 'photo')

    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: false,
      phoneNumber: false,
      photo: false,
    })

    const targetAtom = mockSelectImage.mock.calls[0]?.[0]
    expect(targetAtom).toBeDefined()
    if (!targetAtom) return

    store.set(targetAtom, PHOTO_URI)

    expect(store.get(exchangeDetailsPhotoUriAtom)).toBe(PHOTO_URI)
    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: true,
      phoneNumber: false,
      photo: true,
    })
  })

  it('ticks photo directly without opening the picker when a photo is already set', () => {
    const store = createStore()
    store.set(
      chatWithMessagesAtom,
      chatWithOtherSideVersion(PHOTO_ONLY_VERSION)
    )
    store.set(exchangeDetailsPhotoUriAtom, EXISTING_PHOTO_URI)

    store.set(toggleExchangeDetailActionAtom, 'photo')

    expect(mockSelectImage).not.toHaveBeenCalled()
    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: false,
      phoneNumber: false,
      photo: true,
    })
  })

  it('unticks photo without opening the picker even when no photo is set', () => {
    const store = createStore()
    store.set(
      chatWithMessagesAtom,
      chatWithOtherSideVersion(PHOTO_ONLY_VERSION)
    )
    store.set(exchangeDetailsSelectionAtom, {
      nickname: false,
      phoneNumber: false,
      photo: true,
    })

    store.set(toggleExchangeDetailActionAtom, 'photo')

    expect(mockSelectImage).not.toHaveBeenCalled()
    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: false,
      phoneNumber: false,
      photo: false,
    })
  })

  it('unticks photo when unticking nickname on a legacy chat', () => {
    const store = createStore()
    store.set(chatWithMessagesAtom, chatWithOtherSideVersion(LEGACY_VERSION))
    store.set(exchangeDetailsPhotoUriAtom, EXISTING_PHOTO_URI)
    store.set(exchangeDetailsSelectionAtom, {
      nickname: true,
      phoneNumber: false,
      photo: true,
    })

    store.set(toggleExchangeDetailActionAtom, 'nickname')

    expect(mockSelectImage).not.toHaveBeenCalled()
    expect(store.get(exchangeDetailsSelectionAtom)).toEqual({
      nickname: false,
      phoneNumber: false,
      photo: false,
    })
  })
})

import {Effect} from 'effect'
import {
  getPresentedNotificationsAsync,
  type Notification,
} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {Platform} from 'react-native'
import {flushAllScheduledMmkvWrites} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {storage} from '../../../utils/mmkv/effectMmkv'
import fetchMessagesForAllInboxesAtom from './fetchNewMessagesActionAtom'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('../../../api', () => {
  const {Effect} = jest.requireActual('effect')
  const {atom} = jest.requireActual('jotai')

  return {
    apiAtom: atom({
      metrics: {
        reportNotificationInteraction: jest.fn(() => Effect.void),
      },
    }),
  }
})

jest.mock('expo-notifications', () => ({
  AndroidImportance: {DEFAULT: 5, HIGH: 6},
  AndroidNotificationPriority: {DEFAULT: 'default', HIGH: 'high'},
  dismissNotificationAsync: jest.fn(async () => undefined),
  getPresentedNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
}))

jest.mock('../../../utils/reportError', () => {
  const {Effect} = jest.requireActual('effect')

  return {
    __esModule: true,
    default: jest.fn(),
    reportErrorE: jest.fn(() => Effect.void),
  }
})

jest.mock('../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')

  return {
    getCurrentLocale: () => 'en',
    translationAtom: atom({
      t: (key: string) => key,
      isEnglish: () => true,
    }),
    useTranslation: () => ({
      t: (key: string) => key,
      isEnglish: () => true,
    }),
  }
})

jest.mock('react-native-mmkv')

jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))

const getPresentedNotificationsAsyncMock = jest.mocked(
  getPresentedNotificationsAsync
)

function chatNotification(identifier: string): Notification {
  return {
    request: {
      identifier,
      trigger: null,
      content: {
        launchImageName: null,
        categoryIdentifier: null,
        badge: null,
        sound: null,
        attachments: [],
        interruptionLevel: 'active',
        title: null,
        body: null,
        subtitle: null,
        data: {
          _tag: 'NewChatMessageNoticeNotificationData',
          sentAt: '1782219467129',
          includesSystemNotification: 'true',
        },
        threadIdentifier: null,
      },
    },
    date: 1782219467.129,
  }
}

describe('fetchMessagesForAllInboxesAtom', () => {
  beforeAll(() => {
    jest.replaceProperty(Platform, 'OS', 'ios')
  })

  beforeEach(() => {
    jest.clearAllMocks()
    storage._storage.clearAll()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('waits for iOS notification cleanup before its final MMKV flush', async () => {
    let resolvePresentedNotifications:
      | ((notifications: Notification[]) => void)
      | undefined
    getPresentedNotificationsAsyncMock.mockImplementation(
      async () =>
        await new Promise<Notification[]>((resolve) => {
          resolvePresentedNotifications = resolve
        })
    )

    let reachedDurableBoundary = false
    const fetchAndFlush = Effect.runPromise(
      getDefaultStore().set(fetchMessagesForAllInboxesAtom)
    ).finally(() => {
      flushAllScheduledMmkvWrites()
      reachedDurableBoundary = true
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(getPresentedNotificationsAsyncMock).toHaveBeenCalledTimes(1)
    expect(reachedDurableBoundary).toBe(false)

    resolvePresentedNotifications?.([chatNotification('system-chat-id')])
    await fetchAndFlush

    expect(
      JSON.parse(
        storage._storage.getString('alreadyReportedNotificationsIds') ?? ''
      )
    ).toEqual({alreadyReportedIds: ['system-chat-id']})
  })

  it('propagates iOS notification cleanup failures', async () => {
    const error = new Error('Unable to enumerate presented notifications')
    getPresentedNotificationsAsyncMock.mockRejectedValue(error)

    await expect(
      Effect.runPromise(getDefaultStore().set(fetchMessagesForAllInboxesAtom))
    ).rejects.toThrow('Unable to enumerate presented notifications')
  })
})

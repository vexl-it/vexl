import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  VexlProductNotification,
  VexlProductNotificationUuid,
} from '@vexl-next/domain/src/general/vexlProductNotification'
import {type ContentApi} from '@vexl-next/rest-api/src/services/content'
import {Effect, Schema} from 'effect'
import {createStore, type atom} from 'jotai'
import {type flushAllScheduledMmkvWrites} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {storage} from '../../../utils/mmkv/effectMmkv'
import {type NotificationCenterRecordData} from './domain'
import {type fetchVexlProductNotificationsActionAtom} from './vexlProductNotifications'

const mockFetchNotifications = jest.fn<
  ReturnType<ContentApi['getVexlProductNotifications']>,
  Parameters<ContentApi['getVexlProductNotifications']>
>()
const mockAddNotification = jest.fn<undefined, [NotificationCenterRecordData]>()

jest.mock('../../../api', () => {
  const jotai = jest.requireActual<{atom: typeof atom}>('jotai')
  return {
    apiAtom: jotai.atom({
      content: {
        getVexlProductNotifications: (
          ...args: Parameters<ContentApi['getVexlProductNotifications']>
        ) => mockFetchNotifications(...args),
      },
    }),
  }
})

jest.mock('.', () => {
  const jotai = jest.requireActual<{atom: typeof atom}>('jotai')
  return {
    addNotificationToCenterActionAtom: jotai.atom(
      null,
      (_get, _set, notification: NotificationCenterRecordData) => {
        mockAddNotification(notification)
      }
    ),
  }
})

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../../../utils/mmkv/mmkvDataLossDiagnosticStorage', () => ({
  recordCriticalMmkvKeyPersisted: jest.fn(async () => undefined),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

jest.mock('react-native-mmkv')

const cursorKey = 'vexlProductNotificationsCursor'
const firstLaunch = new Date('2026-10-09T10:00:00.000Z')
const restartTime = new Date('2026-10-09T12:00:00.000Z')
const notification = Schema.decodeUnknownSync(VexlProductNotification)({
  uuid: 'a96a6c61-cc3b-47c5-a3b1-3c109a0fef7a',
  title: 'Published while the app was closed',
  description: 'Appears after restarting',
  issuePushNotification: false,
  date: '2026-10-09T11:00:00.000Z',
  type: 'GENERAL',
})

const PersistedCursor = Schema.parseJson(
  Schema.Struct({
    activeSince: Schema.DateFromString,
    lastFetchedId: Schema.optional(VexlProductNotificationUuid),
  })
)

function persistedCursor(): typeof PersistedCursor.Type {
  return Schema.decodeUnknownSync(PersistedCursor)(
    storage._storage.getString(cursorKey)
  )
}

function launchApp(): {
  fetch: () => Promise<void>
  flush: () => void
} {
  jest.resetModules()
  jest.doMock('../../../utils/mmkv/effectMmkv', () => ({storage}))
  const notificationState = jest.requireActual<{
    fetchVexlProductNotificationsActionAtom: typeof fetchVexlProductNotificationsActionAtom
  }>('./vexlProductNotifications')
  const mmkvAtoms = jest.requireActual<{
    flushAllScheduledMmkvWrites: typeof flushAllScheduledMmkvWrites
  }>('../../../utils/atomUtils/atomWithParsedMmkvStorage')
  const store = createStore()

  return {
    fetch: async () => {
      await Effect.runPromise(
        store.set(notificationState.fetchVexlProductNotificationsActionAtom)
      )
    },
    flush: mmkvAtoms.flushAllScheduledMmkvWrites,
  }
}

beforeEach(() => {
  jest.useFakeTimers({now: firstLaunch})
  storage._storage.clearAll()
  mockFetchNotifications.mockReset()
  mockAddNotification.mockReset()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

it.each(['empty response', 'failed request'])(
  'fetches notifications published before a restart after an initial %s',
  async (firstResult) => {
    mockFetchNotifications.mockReturnValueOnce(
      firstResult === 'empty response'
        ? Effect.succeed({vexlProductNotifications: []})
        : Effect.fail(new UnexpectedServerError({status: 500}))
    )
    const firstApp = launchApp()

    await firstApp.fetch()

    expect(persistedCursor()).toEqual({activeSince: firstLaunch})
    expect(mockAddNotification).not.toHaveBeenCalled()

    jest.setSystemTime(restartTime)
    mockFetchNotifications.mockImplementation(({newerThan}) =>
      Effect.succeed({
        vexlProductNotifications:
          notification.date > newerThan ? [notification] : [],
      })
    )
    const restartedApp = launchApp()

    await restartedApp.fetch()
    restartedApp.flush()

    expect(mockFetchNotifications).toHaveBeenLastCalledWith({
      newerThan: firstLaunch,
      lastVexlProductNotificationUuidFetched: undefined,
    })
    expect(mockAddNotification).toHaveBeenCalledWith({
      _tag: 'VexlProductNotificationData',
      productNotification: notification,
    })
    expect(persistedCursor()).toEqual({
      activeSince: firstLaunch,
      lastFetchedId: notification.uuid,
    })
  }
)

it('preserves an existing start date and last-fetched UUID when no notifications arrive', async () => {
  const cursor = {
    activeSince: new Date('2026-10-08T10:00:00.000Z'),
    lastFetchedId: notification.uuid,
  }
  storage._storage.set(cursorKey, Schema.encodeSync(PersistedCursor)(cursor))
  mockFetchNotifications.mockReturnValue(
    Effect.succeed({vexlProductNotifications: []})
  )
  const app = launchApp()

  await app.fetch()

  expect(mockFetchNotifications).toHaveBeenCalledWith({
    newerThan: cursor.activeSince,
    lastVexlProductNotificationUuidFetched: cursor.lastFetchedId,
  })
  expect(persistedCursor()).toEqual(cursor)
  expect(mockAddNotification).not.toHaveBeenCalled()
})

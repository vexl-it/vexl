import * as Notifications from 'expo-notifications'
import {createStore} from 'jotai'
import {clear as clearNseBridge} from '../../modules/vexl-nse-bridge'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {deleteAllFiles} from '../utils/fsDirectories'
import {
  clearDeviceAfterLoginOnAnotherDeviceActionAtom,
  resetLocalDataActionAtom,
} from './resetLocalDataActionAtom'

const mockApiRead = jest.fn()
const mockShowDialog = jest.fn()

jest.mock('../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    apiAtom: atom(() => {
      mockApiRead()
      throw new Error('No API calls allowed')
    }),
  }
})

jest.mock('./session', () => {
  const {atom} = jest.requireActual('jotai')
  const {none} = jest.requireActual('fp-ts/Option')
  return {sessionAtom: atom(none)}
})

jest.mock('../components/GlobalDialog', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    globalDialogAtom: atom(
      null,
      (_get: unknown, _set: unknown, args: unknown) => {
        mockShowDialog(args)
        return Effect.succeed(true)
      }
    ),
  }
})

jest.mock('../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: (key: string) => key})}
})

jest.mock('./chatTags/atoms', () => {
  const {atom} = jest.requireActual('jotai')
  return {selectedChatTagFiltersAtom: atom(new Set())}
})

jest.mock(
  './connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom',
  () => {
    const {atom} = jest.requireActual('jotai')
    return {
      clearPersistentDataAboutReachAndImportedContactsActionAtom: atom(
        null,
        () => undefined
      ),
    }
  }
)

jest.mock('../utils/notifications/backgroundNotificationSocket', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    clearBackgroundNotificationSocketActionAtom: atom(null, async () => {}),
  }
})

jest.mock('../../modules/vexl-nse-bridge', () => ({
  clear: jest.fn(async () => {}),
}))
jest.mock('../utils/clearMmkvStorageAndEmptyAtoms', () => ({
  __esModule: true,
  default: jest.fn(async () => {}),
}))
jest.mock('../utils/fsDirectories', () => ({
  deleteAllFiles: jest.fn(async () => {}),
}))
jest.mock('expo-notifications', () => ({
  setBadgeCountAsync: jest.fn(async () => true),
  unregisterForNotificationsAsync: jest.fn(async () => {}),
}))

const fetchMock = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
})

it('clears local data without calling any server', async () => {
  await createStore().set(resetLocalDataActionAtom)

  expect(clearMmkvStorageAndEmptyAtoms).toHaveBeenCalled()
  expect(clearNseBridge).toHaveBeenCalled()
  expect(deleteAllFiles).toHaveBeenCalled()
  expect(Notifications.unregisterForNotificationsAsync).toHaveBeenCalled()
  expect(mockApiRead).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

it('tells the user the account moved after clearing the device', async () => {
  await createStore().set(clearDeviceAfterLoginOnAnotherDeviceActionAtom)

  expect(clearMmkvStorageAndEmptyAtoms).toHaveBeenCalled()
  expect(mockShowDialog).toHaveBeenCalledWith(
    expect.objectContaining({title: 'loggedInOnAnotherDevice.title'})
  )
  expect(mockApiRead).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

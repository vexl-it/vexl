import {Effect} from 'effect'
import {getDefaultStore} from 'jotai'
import {refreshOffersActionAtom} from './index'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))
jest.mock('../../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom(() => ({offer: {}})),
}))
jest.mock('../../../../utils/marketplaceReadyNotification/store', () => ({
  markMarketplaceReadyNotificationFlowAsCompletedIfOffersAreVisibleActionAtom:
    jest.requireActual('jotai').atom(null, () => {}),
}))
jest.mock(
  '../../../../utils/newOffersNotificationBackgroundTask/store',
  () => ({
    refreshLastSeenOffersActionAtom: jest
      .requireActual('jotai')
      .atom(null, () => {}),
  })
)
jest.mock(
  '../ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner',
  () => ({
    ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner: jest
      .requireActual('jotai')
      .atom(null, () => jest.requireActual('effect').Effect.void),
  })
)
const mockFetchOffers = jest.fn()
jest.mock('./utils/fetchOffersReportErrorsActionAtom', () => ({
  fetchOffersReportErrorsActionAtom: jest
    .requireActual('jotai')
    .atom(null, () => mockFetchOffers()),
}))
jest.mock('./utils/getRemovedOffersIds', () => ({
  getRemovedOffersIds: () =>
    jest.requireActual('effect').Effect.succeed({
      succeeded: true,
      removedContactOfferIds: [],
      removedClubsOfferIdsToClubUuid: [],
    }),
}))

const store = getDefaultStore()

describe('refreshOffersActionAtom', () => {
  it('tells whether the offers were fetched', async () => {
    mockFetchOffers.mockReturnValue(Effect.succeed({contact: [], clubs: []}))
    expect(await Effect.runPromise(store.set(refreshOffersActionAtom))).toBe(
      true
    )

    mockFetchOffers.mockReturnValue(Effect.fail(new Error('offline')))
    expect(await Effect.runPromise(store.set(refreshOffersActionAtom))).toBe(
      false
    )
  })
})

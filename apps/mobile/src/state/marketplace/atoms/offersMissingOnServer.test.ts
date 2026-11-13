import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Deferred, Effect, Fiber, Schema} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {
  offersMissingOnServerStorageAtom,
  reencryptOffersMissingOnServerActionAtom,
} from './offersMissingOnServer'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom(() => ({offer: {}, contact: {}})),
}))
jest.mock('../../session', () => ({
  sessionDataOrDummyAtom: jest
    .requireActual('jotai')
    .atom(() => ({phoneNumber: '+420733333333'})),
}))
jest.mock('../../../utils/getCountryCode', () => ({
  __esModule: true,
  default: () => 420,
}))
jest.mock('../../clubs/atom/clubsToKeyHolderV2Atom', () => ({
  clubsToKeyHolderAtom: jest.requireActual('jotai').atom({}),
}))
jest.mock(
  '../../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom',
  () => ({
    ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom: jest
      .requireActual('jotai')
      .atom(null, () =>
        jest
          .requireActual('effect')
          .Effect.succeed(jest.requireActual('effect').HashMap.empty())
      ),
  })
)
jest.mock('../../connections/atom/offerToConnectionsAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    deleteOfferToConnectionsAtom: atom(null, () => {}),
    upsertOfferToConnectionsActionAtom: atom(null, () => {}),
  }
})
jest.mock('../../backup/rebuildRestoredOffersAndNotes', () => ({
  forgetReuploadedRestoredOfferActionAtom: jest
    .requireActual('jotai')
    .atom(null, () => {}),
}))
const mockMyOffersAtom = atom<unknown>([])
jest.mock('./myOffers', () => ({
  myOffersAtom: jest
    .requireActual('jotai')
    .atom((get: (a: unknown) => unknown) => get(mockMyOffersAtom)),
}))
jest.mock('./offersState', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    singleOfferAtom: () => atom(null, () => {}),
    singleOfferByAdminIdAtom: () => atom(null),
  }
})
const mockCreateOffer = jest.fn()
jest.mock(
  '@vexl-next/resources-utils/src/offers/createNewOfferForMyContacts',
  () => ({
    __esModule: true,
    default: (params: unknown) => mockCreateOffer(params),
  })
)

const store = getDefaultStore()

const offer = {
  ownershipInfo: {adminId: 'admin-1', intendedConnectionLevel: 'FIRST'},
  offerInfo: {offerId: 'offer-1', publicPart: {}},
}

describe('reencryptOffersMissingOnServerActionAtom', () => {
  it('uploads an offer once when two reuploads overlap', async () => {
    store.set(mockMyOffersAtom, [offer])
    store.set(offersMissingOnServerStorageAtom, {
      offerIds: [Schema.decodeSync(OfferId)('offer-1')],
    })
    const release = Effect.runSync(Deferred.make<boolean>())
    mockCreateOffer.mockImplementation(() =>
      Deferred.await(release).pipe(
        Effect.as({
          encryptionErrors: [],
          adminId: 'admin-2',
          offerInfo: offer.offerInfo,
          symmetricKey: 'key',
          encryptedFor: {
            firstDegreeConnections: [],
            secondDegreeConnections: [],
            clubsConnections: {},
          },
        })
      )
    )

    const first = Effect.runFork(
      store.set(reencryptOffersMissingOnServerActionAtom, {})
    )
    // Let the first reupload reach the upload before the second one starts.
    await Effect.runPromise(Effect.yieldNow())
    const second = await Effect.runPromise(
      store.set(reencryptOffersMissingOnServerActionAtom, {})
    )
    Effect.runSync(Deferred.succeed(release, true))
    const firstResult = await Effect.runPromise(Fiber.join(first))

    expect(mockCreateOffer).toHaveBeenCalledTimes(1)
    expect(second.reuploaded).toEqual([])
    expect(firstResult.reuploaded).toHaveLength(1)
  })
})

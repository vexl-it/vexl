import {KeyHolder} from '@vexl-next/cryptography'
import {KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {Effect, Exit, Schema} from 'effect'
import {createStore} from 'jotai'
import {apiAtom} from '../../../../../api'
import {
  contactOffersNextPageParamAtom,
  extraIdentitiesContactOffersNextPageParamAtom,
} from '../../offersState'
import {
  fetchOffersReportErrorsActionAtom,
  type OffersIdentity,
} from './fetchOffersReportErrorsActionAtom'

jest.mock('../../offersState', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    clubOffersNextPageParamAtom: atom({}),
    contactOffersNextPageParamAtom: atom(undefined),
    extraIdentitiesContactOffersNextPageParamAtom: atom(undefined),
  }
})
jest.mock('../../../../../utils/reportError', () => jest.fn())
jest.mock('./getNewClubsOffersAndDecrypt', () => ({}))
jest.mock('../../../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {apiAtom: atom({offer: {}})}
})
jest.mock('./getNewOffersAndDecrypt', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    // Every identity gets a next page token, then the failing one fails
    getNewContactNetworkOffersAndDecryptPaginatedActionAtom: atom(
      null,
      (
        _get: unknown,
        _set: unknown,
        {
          keyPair,
          storeNextPageToken,
        }: {
          keyPair: {publicKeyPemBase64: string}
          storeNextPageToken: (token: string) => void
        }
      ) =>
        Effect.suspend(() => {
          storeNextPageToken('next-page')
          return keyPair.publicKeyPemBase64 === mockFailingIdentity
            ? Effect.fail(new Error('offline'))
            : Effect.succeed([])
        })
    ),
  }
})

let mockFailingIdentity: string | undefined

const makeIdentity = (index: number): OffersIdentity => {
  const keyPair = KeyHolder.generatePrivateKey()
  return {
    identity: keyPair.publicKeyPemBase64,
    offersApi: createStore().get(apiAtom).offer,
    keyPair,
    keyPairV2: Schema.decodeSync(KeyPairV2)({
      publicKey: `V2_PUB_${index}`,
      privateKey: `V2_PRIV_${index}`,
    }),
  }
}

const mainIdentity = makeIdentity(0)
const extraIdentity = makeIdentity(1)

beforeEach(() => {
  mockFailingIdentity = undefined
})

it('keeps the cursors when the main number fails after an extra one succeeded', async () => {
  const store = createStore()
  mockFailingIdentity = mainIdentity.identity

  const exit = await Effect.runPromiseExit(
    store.set(fetchOffersReportErrorsActionAtom, {
      mainIdentity,
      extraIdentities: [extraIdentity],
      clubs: {},
    })
  )

  expect(Exit.isFailure(exit)).toBe(true)
  expect(store.get(contactOffersNextPageParamAtom)).toBeUndefined()
  expect(
    store.get(extraIdentitiesContactOffersNextPageParamAtom)
  ).toBeUndefined()
})

it('stores the cursors of every identity once committed', async () => {
  const store = createStore()

  const {contact} = await Effect.runPromise(
    store.set(fetchOffersReportErrorsActionAtom, {
      mainIdentity,
      extraIdentities: [extraIdentity],
      clubs: {},
    })
  )
  expect(store.get(contactOffersNextPageParamAtom)).toBeUndefined()

  contact.commitNextPageTokens()

  expect(store.get(contactOffersNextPageParamAtom)).toBe('next-page')
  expect(store.get(extraIdentitiesContactOffersNextPageParamAtom)).toEqual({
    [extraIdentity.identity]: 'next-page',
  })
})

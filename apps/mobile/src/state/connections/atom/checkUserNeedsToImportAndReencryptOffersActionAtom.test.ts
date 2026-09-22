import {Effect} from 'effect'
import {createStore} from 'jotai'
import {checkUserNeedsToImportContactsAndReencryptOffersActionAtom} from './checkUserNeedsToImportAndReencryptOffersActionAtom'
import {unexpectedReachDropDetectedAtom} from './connectionStateAtom'

const mockAskAreYouSure = jest.fn(() => Effect.void)
const mockSubmitContacts = jest.fn((_params: unknown) => Effect.void)

jest.mock('../../../components/GlobalDialog', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    askAreYouSureActionAtom: atom(null, (_get: unknown, _set: unknown) =>
      mockAskAreYouSure()
    ),
  }
})
jest.mock('../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: (key: string) => key})}
})
jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../ActionBenchmarks', () => ({
  effectWithEnsuredBenchmark: () => (effect: unknown) => effect,
}))
jest.mock('../../contacts/atom/submitContactsActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    submitContactsActionAtom: atom(
      null,
      (_get: unknown, _set: unknown, params: unknown) =>
        mockSubmitContacts(params)
    ),
  }
})
jest.mock('./connectionStateAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {unexpectedReachDropDetectedAtom: atom(false)}
})

beforeEach(() => {
  jest.clearAllMocks()
})

it('asks to reimport contacts once after a reach drop', async () => {
  const store = createStore()
  store.set(unexpectedReachDropDetectedAtom, true)
  await Effect.runPromise(
    store.set(checkUserNeedsToImportContactsAndReencryptOffersActionAtom)
  )
  expect(mockAskAreYouSure).toHaveBeenCalledTimes(1)
  expect(mockSubmitContacts).toHaveBeenCalledWith({
    normalizeAndImportAll: true,
    showOfferReencryptionDialog: true,
  })
  expect(store.get(unexpectedReachDropDetectedAtom)).toBe(false)

  await Effect.runPromise(
    store.set(checkUserNeedsToImportContactsAndReencryptOffersActionAtom)
  )
  expect(mockAskAreYouSure).toHaveBeenCalledTimes(1)
})

it('does nothing without a reach drop', async () => {
  const store = createStore()
  await Effect.runPromise(
    store.set(checkUserNeedsToImportContactsAndReencryptOffersActionAtom)
  )
  expect(mockAskAreYouSure).not.toHaveBeenCalled()
  expect(mockSubmitContacts).not.toHaveBeenCalled()
})

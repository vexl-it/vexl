import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, Schema} from 'effect'
import {createStore} from 'jotai'
import {
  addLostPhoneNumbersToNoticeActionAtom,
  lostPhoneNumbersNoticeAtom,
  showLostPhoneNumbersNoticeIfPendingActionAtom,
} from './lostPhoneNumbersNotice'

const mockShowDialog = jest.fn<Effect.Effect<boolean>, [unknown]>(() =>
  Effect.succeed(true)
)

jest.mock('../../components/GlobalDialog', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    globalDialogAtom: atom(
      null,
      (_get: unknown, _set: unknown, args: unknown) => mockShowDialog(args)
    ),
  }
})

jest.mock('../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: (key: string) => key})}
})

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({}))

const first = Schema.decodeSync(E164PhoneNumber)('+420733733733')
const second = Schema.decodeSync(E164PhoneNumber)('+420777777777')

beforeEach(() => {
  mockShowDialog.mockClear()
  createStore().set(lostPhoneNumbersNoticeAtom, {phoneNumbers: []})
})

it('shows one dialog per lost number and clears the notice', async () => {
  const store = createStore()
  store.set(addLostPhoneNumbersToNoticeActionAtom, [first, second])

  await Effect.runPromise(
    store.set(showLostPhoneNumbersNoticeIfPendingActionAtom)
  )

  expect(mockShowDialog).toHaveBeenCalledTimes(2)
  expect(store.get(lostPhoneNumbersNoticeAtom).phoneNumbers).toEqual([])
})

it('keeps numbers lost while the notice was open', async () => {
  const store = createStore()
  store.set(addLostPhoneNumbersToNoticeActionAtom, [first])
  mockShowDialog.mockImplementationOnce(() =>
    Effect.sync(() => {
      store.set(addLostPhoneNumbersToNoticeActionAtom, [second])
      return true
    })
  )

  await Effect.runPromise(
    store.set(showLostPhoneNumbersNoticeIfPendingActionAtom)
  )

  expect(store.get(lostPhoneNumbersNoticeAtom).phoneNumbers).toEqual([second])
})

it('shows nothing without lost numbers', async () => {
  await Effect.runPromise(
    createStore().set(showLostPhoneNumbersNoticeIfPendingActionAtom)
  )

  expect(mockShowDialog).not.toHaveBeenCalled()
})

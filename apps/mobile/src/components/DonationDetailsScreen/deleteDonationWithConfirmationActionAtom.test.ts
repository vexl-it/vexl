import {
  InvoicePaymentMethod,
  InvoiceStatus,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Deferred, Effect, Schema, pipe} from 'effect'
import {createStore} from 'jotai'
import {
  myDonationsAtom,
  setMyDonationsAndSaveImmediatelyActionAtom,
  singleDonationAtom,
} from '../../state/donations/atom'
import {MyDonation} from '../../state/donations/domain'
import {flushAllScheduledMmkvWrites} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {storage} from '../../utils/mmkv/effectMmkv'
import {deleteDonationWithConfirmationActionAtom} from './deleteDonationWithConfirmationActionAtom'

const mockDialogResponse = jest.fn<Effect.Effect<boolean>, [unknown]>()

jest.mock('../GlobalDialog', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    globalDialogAtom: atom(
      null,
      (_get: unknown, _set: unknown, options: unknown) =>
        mockDialogResponse(options)
    ),
  }
})

jest.mock('../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: (key: string) => key})}
})

jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../../utils/mmkv/mmkvDataLossDiagnosticStorage', () => ({
  recordCriticalMmkvKeyPersisted: jest.fn(async () => undefined),
}))

jest.mock('react-native-mmkv')

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

function donation(
  invoiceId: string,
  status: InvoiceStatus = 'New',
  paymentMethod: InvoicePaymentMethod = 'BTC-LN'
): MyDonation {
  return Schema.decodeUnknownSync(MyDonation)({
    invoiceId,
    storeId: 'donation-store',
    status,
    paymentMethod,
    exchangeRate: '75000',
    paymentLink: 'lightning:invoice',
    fiatAmount: '10',
    btcAmount: '0.00013333',
    currency: 'EUR',
    createdTime: 1_790_000_000_000,
    expirationTime: 1_790_000_900_000,
  })
}

function persistedDonations(): readonly MyDonation[] {
  return Schema.decodeUnknownSync(
    Schema.parseJson(Schema.Struct({data: Schema.Array(MyDonation)}))
  )(storage._storage.getString('myDonations')).data
}

beforeEach(() => {
  flushAllScheduledMmkvWrites()
  storage._storage.clearAll()
  mockDialogResponse.mockReset()
})

const donationTypes = pipe(
  InvoiceStatus.literals,
  Array.flatMap((status) =>
    pipe(
      InvoicePaymentMethod.literals,
      Array.map((paymentMethod) => ({status, paymentMethod}))
    )
  )
)

it.each(donationTypes)(
  'deletes only the confirmed $status $paymentMethod donation and persists it immediately',
  async ({status, paymentMethod}) => {
    const store = createStore()
    const selected = donation('selected', status, paymentMethod)
    const other = donation('other')
    store.set(setMyDonationsAndSaveImmediatelyActionAtom, {
      data: [selected, other],
    })
    mockDialogResponse.mockReturnValueOnce(Effect.succeed(true))

    const deleted = await Effect.runPromise(
      store.set(deleteDonationWithConfirmationActionAtom, selected.invoiceId)
    )

    expect(deleted).toBe(true)
    expect(store.get(myDonationsAtom)).toEqual([other])
    expect(persistedDonations()).toEqual([other])
    expect(mockDialogResponse).toHaveBeenCalledWith({
      title: 'donations.detail.deleteDonation',
      subtitle: 'donations.detail.deleteDonationDescription',
      positiveButtonText: 'common.yesDelete',
      positiveButtonVariant: 'destructive',
      negativeButtonText: 'common.cancel',
    })
  }
)

it('keeps the donation in memory and storage when confirmation is cancelled', async () => {
  const store = createStore()
  const selected = donation('selected')
  store.set(setMyDonationsAndSaveImmediatelyActionAtom, {data: [selected]})
  mockDialogResponse.mockReturnValueOnce(Effect.succeed(false))

  expect(
    await Effect.runPromise(
      store.set(deleteDonationWithConfirmationActionAtom, selected.invoiceId)
    )
  ).toBe(false)
  expect(store.get(myDonationsAtom)).toEqual([selected])
  expect(persistedDonations()).toEqual([selected])
})

it('waits for confirmation and preserves changes made while the dialog is open', async () => {
  const store = createStore()
  const selected = donation('selected')
  const other = donation('other')
  const added = donation('added')
  store.set(setMyDonationsAndSaveImmediatelyActionAtom, {
    data: [selected, other],
  })
  const confirmation = Effect.runSync(Deferred.make<boolean>())
  mockDialogResponse.mockReturnValueOnce(Deferred.await(confirmation))

  const deletion = Effect.runPromise(
    store.set(deleteDonationWithConfirmationActionAtom, selected.invoiceId)
  )
  expect(store.get(myDonationsAtom)).toEqual([selected, other])
  expect(persistedDonations()).toEqual([selected, other])
  const updatedOther: MyDonation = {...other, status: 'Settled'}
  store.set(myDonationsAtom, [selected, updatedOther, added])
  Effect.runSync(Deferred.succeed(confirmation, true))

  await deletion
  expect(persistedDonations()).toEqual([updatedOther, added])
  flushAllScheduledMmkvWrites()
  expect(persistedDonations()).toEqual([updatedOther, added])

  store.set(singleDonationAtom(selected.invoiceId), (previous) => ({
    ...previous,
    status: 'Settled',
  }))
  flushAllScheduledMmkvWrites()
  expect(store.get(myDonationsAtom)).toEqual([updatedOther, added])
  expect(persistedDonations()).toEqual([updatedOther, added])
})

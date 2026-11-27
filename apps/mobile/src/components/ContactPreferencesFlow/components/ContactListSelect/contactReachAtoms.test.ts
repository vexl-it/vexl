import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberUnsafe} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, HashMap, Schema, type Array, type Option} from 'effect'
import {
  atom,
  createStore,
  type ExtractAtomArgs,
  type Getter,
  type Setter,
} from 'jotai'
import connectionStateAtom from '../../../../state/connections/atom/connectionStateAtom'
import {ConnectionsState} from '../../../../state/connections/domain'
import {storedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {type submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {StoredContact} from '../../../../state/contacts/domain'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
import {createContactReachAtoms} from './contactReachAtoms'
import {createSubmitSelectedContactsAtom} from './createSubmitSelectedContactsAtom'

jest.mock('../../../../state/connections/atom/connectionStateAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const connectionState = atom({})
  return {
    __esModule: true,
    default: connectionState,
    reachNumberAtom: atom(139),
    fistAndSecondLevelConnectionsReachAtom: atom(
      (get: Getter) =>
        new Set([
          ...get<ConnectionsState>(connectionState).firstLevel,
          ...get<ConnectionsState>(connectionState).secondLevel,
        ]).size
    ),
  }
})
jest.mock('../../../../state/contacts/atom/contactsStore', () => {
  const jotai: {atom: typeof atom} = jest.requireActual('jotai')
  const effect: {Array: typeof Array; Option: typeof Option} =
    jest.requireActual('effect')
  const storedContactsAtom = jotai.atom<StoredContact[]>([])
  return {
    storedContactsAtom,
    normalizedContactsAtom: jotai.atom((get) =>
      effect.Array.filterMap(get(storedContactsAtom), (contact) =>
        effect.Option.map(contact.computedValues, (computedValues) => ({
          ...contact,
          computedValues,
        }))
      )
    ),
  }
})
jest.mock('../../../../state/contacts/atom/submitContactsActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    submitContactsActionAtom: atom(
      null,
      (
        get: Getter,
        set: Setter,
        params: ExtractAtomArgs<typeof submitContactsActionAtom>[0]
      ) => mockSubmit(get, set, params)
    ),
  }
})
jest.mock('../../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    translationAtom: atom({
      t: (key: string, values?: unknown) => JSON.stringify({key, values}),
    }),
  }
})
jest.mock('../../../../utils/localization/formattingLocaleAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {formattingLocaleAtom: atom('en-US')}
})
jest.mock('../../../ToastNotification/atom', () => {
  const {atom} = jest.requireActual('jotai')
  return {toastNotificationAtom: atom('')}
})

const anna = Schema.decodeUnknownSync(E164PhoneNumberUnsafe)('+420601111111')
const petr = Schema.decodeUnknownSync(E164PhoneNumberUnsafe)('+420601222222')
const annaHash = Schema.decodeUnknownSync(HashedPhoneNumber)('anna')
const petrHash = Schema.decodeUnknownSync(HashedPhoneNumber)('petr')
const alice = generatePrivateKey().publicKeyPemBase64
const bob = generatePrivateKey().publicKeyPemBase64
const initial = Schema.decodeUnknownSync(ConnectionsState)({
  lastUpdate: 1,
  firstLevel: [],
  secondLevel: [],
  commonFriends: [],
  syncedContactHashes: ['anna', 'petr'],
})
const mockSubmit = jest.fn(
  (
    _get: Getter,
    _set: Setter,
    _params: ExtractAtomArgs<typeof submitContactsActionAtom>[0]
  ): Effect.Effect<string> => Effect.succeed('success')
)

function contact(
  number: typeof anna,
  hash: typeof annaHash,
  imported: boolean
): StoredContact {
  return Schema.decodeUnknownSync(StoredContact)({
    info: {name: hash, rawNumber: number, numberToDisplay: number},
    computedValues: {normalizedNumber: number, hash},
    flags: {
      seen: true,
      imported,
      importedManually: false,
      invalidNumber: 'valid',
    },
  })
}

function setup(): {
  store: ReturnType<typeof createStore>
  selected: ReturnType<typeof atom<Set<typeof anna>>>
  order: ReturnType<typeof atom<ReadonlyArray<typeof anna>>>
} {
  const store = createStore()
  store.set(connectionStateAtom, {
    ...initial,
    secondLevel: [alice, bob],
    commonFriends: HashMap.make(
      [alice, [annaHash, petrHash]],
      [bob, [petrHash]]
    ),
  })
  store.set(storedContactsAtom, [
    contact(anna, annaHash, true),
    contact(petr, petrHash, true),
  ])
  return {
    store,
    selected: atom(new Set([anna, petr])),
    order: atom<ReadonlyArray<typeof anna>>([]),
  }
}

beforeEach(() => mockSubmit.mockReset())

it('updates usage, row costs and total together, without pending additions offsetting losses', () => {
  const {store, selected, order} = setup()
  const state = createContactReachAtoms({
    selectedNumbersAtom: selected,
    pendingOffOrderAtom: order,
  })
  expect(store.get(state.contactUsageAtom)).toEqual({used: 2, total: 2})
  expect(store.get(state.contactReachAtom(anna))).toEqual({
    type: 'active',
    people: 1,
    exclusive: 0,
  })
  store.set(selected, new Set())
  store.set(order, [anna, petr])
  expect(store.get(state.contactReachAtom(anna))).toEqual({
    type: 'pendingOff',
    loss: 0,
  })
  expect(store.get(state.contactReachAtom(petr))).toEqual({
    type: 'pendingOff',
    loss: 2,
  })
  expect(store.get(state.contactLossTotalAtom)).toBe(2)
  store.set(selected, new Set([anna]))
  expect(store.get(state.contactReachAtom(petr))).toEqual({
    type: 'pendingOff',
    loss: 1,
  })
  expect(store.get(state.contactUsageAtom)).toEqual({used: 1, total: 2})
})

it('counts direct contacts in the total loss once every contact is switched off', () => {
  const {store, selected, order} = setup()
  const carol = generatePrivateKey().publicKeyPemBase64
  store.set(connectionStateAtom, {
    ...store.get(connectionStateAtom),
    firstLevel: [carol],
  })
  const state = createContactReachAtoms({
    selectedNumbersAtom: selected,
    pendingOffOrderAtom: order,
  })
  store.set(selected, new Set([anna]))
  store.set(order, [petr])
  expect(store.get(state.contactLossTotalAtom)).toBe(1)
  store.set(selected, new Set())
  store.set(order, [petr, anna])
  expect(store.get(state.contactLossTotalAtom)).toBe(3)
})

it('hides unknown/legacy snapshots and newly imported rows until covered by a successful sync', () => {
  const {store, selected, order} = setup()
  const state = createContactReachAtoms({
    selectedNumbersAtom: selected,
    pendingOffOrderAtom: order,
  })
  store.set(connectionStateAtom, {
    ...initial,
    syncedContactHashes: new Set([annaHash]),
  })
  expect(store.get(state.contactReachAtom(petr))).toEqual({type: 'notSynced'})
  store.set(connectionStateAtom, {...initial, syncedContactHashes: undefined})
  expect(store.get(state.contactReachAtom(anna))).toEqual({type: 'notSynced'})
  store.set(connectionStateAtom, initial)
  expect(store.get(state.contactReachAtom(petr))).toEqual({
    type: 'active',
    people: 0,
    exclusive: 0,
  })
})

it('gives unused and pending-on contacts no figures, even when stale graph data exists', () => {
  const {store, selected, order} = setup()
  store.set(storedContactsAtom, [
    contact(anna, annaHash, false),
    contact(petr, petrHash, true),
  ])
  const state = createContactReachAtoms({
    selectedNumbersAtom: selected,
    pendingOffOrderAtom: order,
  })
  expect(store.get(state.contactReachAtom(anna))).toEqual({type: 'pendingOn'})
  store.set(selected, new Set([petr]))
  expect(store.get(state.contactReachAtom(anna))).toEqual({type: 'unused'})
})

it('does not notify an unchanged active row when another selection changes', () => {
  const {store, selected, order} = setup()
  const state = createContactReachAtoms({
    selectedNumbersAtom: selected,
    pendingOffOrderAtom: order,
  })
  const listener = jest.fn()
  const unsubscribe = store.sub(state.contactReachAtom(anna), listener)
  store.set(selected, new Set([anna]))
  expect(listener).not.toHaveBeenCalled()
  unsubscribe()
})

it('shows named gain only for new common-friend people after one addition, never a direct-only gain', async () => {
  const {store, selected} = setup()
  store.set(storedContactsAtom, [
    contact(anna, annaHash, true),
    contact(petr, petrHash, false),
  ])
  store.set(connectionStateAtom, {
    ...initial,
    commonFriends: HashMap.make([alice, [annaHash]]),
  })
  const submit = createSubmitSelectedContactsAtom({
    selectedNumbersAtom: selected,
    shouldShowContactImportProgressDialogAtom: atom(false),
  })
  mockSubmit.mockImplementation((_get, set, params) =>
    Effect.sync(() => {
      set(connectionStateAtom, {
        ...initial,
        lastUpdate: Schema.decodeUnknownSync(UnixMilliseconds)(2),
        commonFriends: HashMap.make([alice, [petrHash]], [bob, [petrHash]]),
      })
      params.onConnectionsRefresh?.(true)
      return 'success'
    })
  )
  await Effect.runPromise(store.set(submit))
  expect(store.get(toastNotificationAtom)).toContain(
    'contacts.contactsSubmittedGain'
  )
  expect(store.get(toastNotificationAtom)).toContain('"count":1')
  store.set(connectionStateAtom, initial)
  mockSubmit.mockImplementation((_get, set, params) =>
    Effect.sync(() => {
      set(connectionStateAtom, {
        ...initial,
        lastUpdate: Schema.decodeUnknownSync(UnixMilliseconds)(2),
        firstLevel: [bob],
      })
      params.onConnectionsRefresh?.(true)
      return 'success'
    })
  )
  await Effect.runPromise(store.set(submit))
  expect(store.get(toastNotificationAtom)).toContain(
    'contacts.contactsSubmittedReach'
  )
  expect(store.get(toastNotificationAtom)).toContain('139')
})

it('falls back to the existing toast on refresh failure and shows no toast for failed import', async () => {
  const {store, selected} = setup()
  const submit = createSubmitSelectedContactsAtom({
    selectedNumbersAtom: selected,
    shouldShowContactImportProgressDialogAtom: atom(false),
  })
  mockSubmit.mockReturnValue(Effect.succeed('success'))
  await Effect.runPromise(store.set(submit))
  expect(store.get(toastNotificationAtom)).toBe(
    JSON.stringify({key: 'contacts.contactsSubmitted'})
  )
  store.set(toastNotificationAtom, 'unchanged')
  mockSubmit.mockReturnValue(Effect.succeed('otherError'))
  expect(await Effect.runPromise(store.set(submit))).toBe(false)
  expect(store.get(toastNotificationAtom)).toBe('unchanged')
})

it('does not credit someone already directly reachable as a new person', async () => {
  const {store, selected} = setup()
  store.set(storedContactsAtom, [
    contact(anna, annaHash, true),
    contact(petr, petrHash, false),
  ])
  store.set(connectionStateAtom, {...initial, firstLevel: [bob]})
  const submit = createSubmitSelectedContactsAtom({
    selectedNumbersAtom: selected,
    shouldShowContactImportProgressDialogAtom: atom(false),
  })
  mockSubmit.mockImplementation((_get, set, params) =>
    Effect.sync(() => {
      set(connectionStateAtom, {
        ...initial,
        lastUpdate: Schema.decodeUnknownSync(UnixMilliseconds)(2),
        commonFriends: HashMap.make([bob, [petrHash]]),
      })
      params.onConnectionsRefresh?.(true)
      return 'success'
    })
  )
  await Effect.runPromise(store.set(submit))
  expect(store.get(toastNotificationAtom)).toContain(
    'contacts.contactsSubmittedReach'
  )
})

it('counts only new indirect people when several added contacts become direct and appear through each other', async () => {
  const {store, selected} = setup()
  const charlie = generatePrivateKey().publicKeyPemBase64
  store.set(storedContactsAtom, [
    contact(anna, annaHash, false),
    contact(petr, petrHash, false),
  ])
  const submit = createSubmitSelectedContactsAtom({
    selectedNumbersAtom: selected,
    shouldShowContactImportProgressDialogAtom: atom(false),
  })
  const submitWith = async (
    commonFriends: ConnectionsState['commonFriends']
  ): Promise<void> => {
    store.set(connectionStateAtom, initial)
    mockSubmit.mockImplementation((_get, set, params) =>
      Effect.sync(() => {
        set(connectionStateAtom, {
          ...initial,
          lastUpdate: Schema.decodeUnknownSync(UnixMilliseconds)(2),
          firstLevel: [alice, bob],
          commonFriends,
        })
        params.onConnectionsRefresh?.(true)
        return 'success'
      })
    )
    await Effect.runPromise(store.set(submit))
  }

  await submitWith(HashMap.make([alice, [petrHash]], [bob, [annaHash]]))
  expect(store.get(toastNotificationAtom)).toContain(
    'contacts.contactsSubmittedReach'
  )
  expect(store.get(toastNotificationAtom)).toContain('139')

  await submitWith(
    HashMap.make(
      [alice, [petrHash]],
      [bob, [annaHash]],
      [charlie, [annaHash, petrHash]]
    )
  )
  expect(store.get(toastNotificationAtom)).toBe(
    JSON.stringify({
      key: 'contacts.contactsSubmittedGainMultiple',
      values: {count: 1, localizedString: '1'},
    })
  )
})

it('does not mistake a concurrent background sync for this Submit refresh succeeding', async () => {
  const {store, selected} = setup()
  const submit = createSubmitSelectedContactsAtom({
    selectedNumbersAtom: selected,
    shouldShowContactImportProgressDialogAtom: atom(false),
  })
  mockSubmit.mockImplementation((_get, set, params) =>
    Effect.sync(() => {
      set(connectionStateAtom, {
        ...initial,
        lastUpdate: Schema.decodeUnknownSync(UnixMilliseconds)(2),
      })
      params.onConnectionsRefresh?.(false)
      return 'success'
    })
  )
  await Effect.runPromise(store.set(submit))
  expect(store.get(toastNotificationAtom)).toBe(
    JSON.stringify({key: 'contacts.contactsSubmitted'})
  )
})

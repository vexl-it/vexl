import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Option, Schema} from 'effect'
import {
  findNumbersDeletedFromPhone,
  findNumbersToRemoveFromNetwork,
  syncStoredContactsWithDevice,
} from './deviceContactsSync'
import {type StoredContact} from './domain'

const toE164 = Schema.decodeSync(E164PhoneNumber)

function contact({
  rawNumber,
  normalizedNumber = rawNumber,
  imported = false,
  importedManually = false,
  normalized = true,
}: {
  readonly rawNumber: string
  readonly normalizedNumber?: string
  readonly imported?: boolean
  readonly importedManually?: boolean
  readonly normalized?: boolean
}): StoredContact {
  return {
    info: {
      name: rawNumber,
      label: Option.none(),
      nonUniqueContactId: Option.none(),
      numberToDisplay: rawNumber,
      rawNumber,
    },
    computedValues: normalized
      ? Option.some({
          normalizedNumber: toE164(normalizedNumber),
          hash: Schema.decodeSync(HashedPhoneNumber)(
            `hash-${normalizedNumber}`
          ),
        })
      : Option.none(),
    serverHashToClient: Option.none(),
    flags: {
      seen: true,
      imported,
      importedManually,
      invalidNumber: normalized ? 'valid' : 'notTriedYet',
    },
  }
}

const numberOf = (one: StoredContact): E164PhoneNumber =>
  Option.getOrThrow(one.computedValues).normalizedNumber

const phoneNumber = (i: number): string =>
  `+42077700${String(i).padStart(4, '0')}`

const phoneContacts = (count: number): StoredContact[] =>
  Array.from({length: count}, (_, i) => contact({rawNumber: phoneNumber(i)}))

const rawNumbersOf = (contacts: readonly StoredContact[]): Set<string> =>
  new Set(contacts.map((one) => one.info.rawNumber))

describe('syncStoredContactsWithDevice', () => {
  const onPhone = contact({rawNumber: '+420777111001', imported: true})
  const deletedInactive = contact({rawNumber: '+420777111002'})
  const deletedActive = contact({rawNumber: '+420777111003', imported: true})
  const vexlOnly = contact({rawNumber: '+420777111004', importedManually: true})
  const vexlContactSavedToPhone = contact({
    rawNumber: '+420777111005',
    importedManually: true,
  })
  const sameNumberReformatted = contact({
    rawNumber: '777 111 006',
    normalizedNumber: '+420777111006',
    imported: true,
  })
  const sameNumberOnPhone = contact({rawNumber: '+420777111006'})
  const neverOnPhone = contact({rawNumber: '+420777111007'})

  const storedContacts = [
    onPhone,
    deletedInactive,
    deletedActive,
    vexlOnly,
    vexlContactSavedToPhone,
    sameNumberReformatted,
    sameNumberOnPhone,
    neverOnPhone,
  ]
  const deviceRawNumbers = rawNumbersOf([
    onPhone,
    vexlContactSavedToPhone,
    sameNumberOnPhone,
  ])
  const numbersInPhoneAtLastSync = [
    onPhone,
    deletedInactive,
    deletedActive,
    vexlContactSavedToPhone,
    sameNumberOnPhone,
  ].map(numberOf)

  it('drops inactive contacts deleted from the phone, keeps the rest and turns contacts on the phone into phone contacts', () => {
    const result = syncStoredContactsWithDevice(
      storedContacts,
      deviceRawNumbers,
      numbersInPhoneAtLastSync
    )

    expect(result).toEqual([
      onPhone,
      deletedActive,
      vexlOnly,
      {
        ...vexlContactSavedToPhone,
        flags: {...vexlContactSavedToPhone.flags, importedManually: false},
      },
      sameNumberReformatted,
      sameNumberOnPhone,
      neverOnPhone,
    ])
  })

  it('drops nothing on the first sync', () => {
    const result = syncStoredContactsWithDevice(
      storedContacts,
      deviceRawNumbers,
      undefined
    )

    expect(result).toContain(deletedInactive)
  })

  it('changes nothing when the address book read is empty', () => {
    expect(
      syncStoredContactsWithDevice(
        storedContacts,
        new Set(),
        numbersInPhoneAtLastSync
      )
    ).toBe(storedContacts)
  })
})

describe('findNumbersDeletedFromPhone', () => {
  const contacts = phoneContacts(100)
  const numbersInPhoneAtLastSync = contacts.map(numberOf)

  it('returns numbers that were in the phone at the last sync and are gone now', () => {
    const deleted = contacts.slice(0, 10)
    const notInPhoneBefore = contact({rawNumber: '+420777999999'})

    expect(
      findNumbersDeletedFromPhone({
        storedContacts: [...contacts, notInPhoneBefore],
        rawNumbersOnDevice: rawNumbersOf(contacts.slice(10)),
        numbersInPhoneAtLastSync,
      })
    ).toEqual(new Set(deleted.map(numberOf)))
  })

  it('returns nothing on the first sync', () => {
    expect(
      findNumbersDeletedFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: rawNumbersOf(contacts.slice(1)),
        numbersInPhoneAtLastSync: undefined,
      }).size
    ).toBe(0)
  })

  it('returns nothing when too many numbers are missing at once', () => {
    expect(
      findNumbersDeletedFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: rawNumbersOf(contacts.slice(11)),
        numbersInPhoneAtLastSync,
      }).size
    ).toBe(0)
  })

  it('returns nothing while an address book entry is not normalized yet', () => {
    const reformattedNotNormalized = contact({
      rawNumber: '777 000 0000',
      normalized: false,
    })

    expect(
      findNumbersDeletedFromPhone({
        storedContacts: [...contacts, reformattedNotNormalized],
        rawNumbersOnDevice: rawNumbersOf([
          ...contacts.slice(1),
          reformattedNotNormalized,
        ]),
        numbersInPhoneAtLastSync,
      }).size
    ).toBe(0)
  })
})

describe('findNumbersToRemoveFromNetwork', () => {
  const activeContact = (i: number): StoredContact =>
    contact({rawNumber: phoneNumber(i), imported: true})
  const first = activeContact(0)
  const second = activeContact(1)
  const third = activeContact(2)
  const active = [first, second, third, activeContact(3)]

  it('removes deleted active numbers unless one of their contacts was added in Vexl', () => {
    const addedInVexlDuplicate = contact({
      rawNumber: second.info.rawNumber,
      importedManually: true,
    })

    expect(
      findNumbersToRemoveFromNetwork(
        [...active, addedInVexlDuplicate],
        new Set([numberOf(first), numberOf(second)])
      )
    ).toEqual(new Set([numberOf(first)]))
  })

  it('removes nothing when more than half of the network would go', () => {
    expect(
      findNumbersToRemoveFromNetwork(
        active,
        new Set([first, second, third].map(numberOf))
      ).size
    ).toBe(0)
    expect(
      findNumbersToRemoveFromNetwork(
        active,
        new Set([first, second].map(numberOf))
      ).size
    ).toBe(2)
  })
})

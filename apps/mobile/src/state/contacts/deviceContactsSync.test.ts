import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Option, Schema} from 'effect'
import {
  findNumbersInPhone,
  findNumbersMissingFromPhone,
  findNumbersToRemoveFromNetwork,
  keepPhoneSyncState,
  nextPhoneSyncState,
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
  const lastSync = {
    numbersInPhone: [
      onPhone,
      deletedInactive,
      deletedActive,
      vexlContactSavedToPhone,
      sameNumberOnPhone,
    ].map(numberOf),
    numbersMissing: [deletedInactive, deletedActive].map(numberOf),
  }

  it('drops inactive contacts deleted from the phone, keeps the rest and turns contacts on the phone into phone contacts', () => {
    const result = syncStoredContactsWithDevice(
      storedContacts,
      deviceRawNumbers,
      lastSync
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

  it('drops nothing missing for the first time or on the first sync', () => {
    expect(
      syncStoredContactsWithDevice(storedContacts, deviceRawNumbers, {
        ...lastSync,
        numbersMissing: [],
      })
    ).toContain(deletedInactive)
    expect(
      syncStoredContactsWithDevice(storedContacts, deviceRawNumbers, undefined)
    ).toContain(deletedInactive)
  })

  it('changes nothing when the address book read is empty', () => {
    expect(
      syncStoredContactsWithDevice(storedContacts, new Set(), lastSync)
    ).toBe(storedContacts)
  })
})

describe('findNumbersMissingFromPhone', () => {
  const contacts = phoneContacts(100)
  const allInPhone = {
    numbersInPhone: contacts.map(numberOf),
    numbersMissing: [],
  }
  const withoutFirst = rawNumbersOf(contacts.slice(1))

  it('counts a number as deleted once it is missing on two syncs in a row', () => {
    const firstSync = findNumbersMissingFromPhone({
      storedContacts: contacts,
      rawNumbersOnDevice: withoutFirst,
      lastSync: allInPhone,
    })
    const missingFirst = new Set(contacts.slice(0, 1).map(numberOf))
    expect(firstSync).toEqual(
      Option.some({missing: missingFirst, deleted: new Set()})
    )

    const afterFirstSync = nextPhoneSyncState(
      findNumbersInPhone(contacts, withoutFirst),
      Option.getOrThrow(firstSync)
    )
    expect(
      findNumbersMissingFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: withoutFirst,
        lastSync: afterFirstSync,
      })
    ).toEqual(Option.some({missing: missingFirst, deleted: missingFirst}))
  })

  it('forgets a missing number that comes back', () => {
    const afterFirstSync = nextPhoneSyncState(
      findNumbersInPhone(contacts, withoutFirst),
      Option.getOrThrow(
        findNumbersMissingFromPhone({
          storedContacts: contacts,
          rawNumbersOnDevice: withoutFirst,
          lastSync: allInPhone,
        })
      )
    )
    const back = findNumbersMissingFromPhone({
      storedContacts: contacts,
      rawNumbersOnDevice: rawNumbersOf(contacts),
      lastSync: afterFirstSync,
    })

    expect(
      nextPhoneSyncState(
        findNumbersInPhone(contacts, rawNumbersOf(contacts)),
        Option.getOrThrow(back)
      ).numbersMissing
    ).toEqual([])
  })

  it("can't tell on the first sync", () => {
    expect(
      findNumbersMissingFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: withoutFirst,
        lastSync: undefined,
      })
    ).toEqual(Option.none())
  })

  it("can't tell when too many numbers are missing at once", () => {
    expect(
      findNumbersMissingFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: rawNumbersOf(contacts.slice(11)),
        lastSync: allInPhone,
      })
    ).toEqual(Option.none())
  })

  it("can't tell while an address book entry is not stored and normalized yet", () => {
    const reformattedNotNormalized = contact({
      rawNumber: '777 000 0000',
      normalized: false,
    })

    expect(
      findNumbersMissingFromPhone({
        storedContacts: [...contacts, reformattedNotNormalized],
        rawNumbersOnDevice: rawNumbersOf([
          ...contacts.slice(1),
          reformattedNotNormalized,
        ]),
        lastSync: allInPhone,
      })
    ).toEqual(Option.none())
    expect(
      findNumbersMissingFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: new Set([...withoutFirst, '777 000 0000']),
        lastSync: allInPhone,
      })
    ).toEqual(Option.none())
  })
})

describe('keepPhoneSyncState', () => {
  it('adds newly seen numbers and keeps the rest', () => {
    const first = toE164(phoneNumber(0))
    const second = toE164(phoneNumber(1))
    const lastSync = {numbersInPhone: [first], numbersMissing: [first]}

    expect(keepPhoneSyncState(lastSync, new Set([second]))).toEqual({
      numbersInPhone: [first, second],
      numbersMissing: [first],
    })
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
    ).toEqual(Option.some(new Set([numberOf(first)])))
  })

  it('removes nothing when more than half of the active phone contacts would go', () => {
    const addedInVexl = ['+420777999998', '+420777999999'].map((rawNumber) =>
      contact({rawNumber, imported: true, importedManually: true})
    )

    expect(
      findNumbersToRemoveFromNetwork(
        [...active, ...addedInVexl],
        new Set([first, second, third].map(numberOf))
      )
    ).toEqual(Option.none())
    expect(
      findNumbersToRemoveFromNetwork(
        active,
        new Set([first, second].map(numberOf))
      )
    ).toEqual(Option.some(new Set([first, second].map(numberOf))))
  })
})

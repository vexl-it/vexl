import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Option, Schema} from 'effect'
import {
  addNumbersInPhone,
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
  invalidNumber = normalized ? 'valid' : 'notTriedYet',
}: {
  readonly rawNumber: string
  readonly normalizedNumber?: string
  readonly imported?: boolean
  readonly importedManually?: boolean
  readonly normalized?: boolean
  readonly invalidNumber?: StoredContact['flags']['invalidNumber']
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
      invalidNumber,
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
    expect(
      syncStoredContactsWithDevice(storedContacts, deviceRawNumbers, undefined)
    ).toContain(deletedInactive)
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
  const withoutFirst = rawNumbersOf(contacts.slice(1))

  it('returns numbers that were in the phone at the last sync and are gone now', () => {
    expect(
      findNumbersDeletedFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: withoutFirst,
        numbersInPhoneAtLastSync,
      })
    ).toEqual(Option.some(new Set(contacts.slice(0, 1).map(numberOf))))
  })

  it("can't tell on the first sync", () => {
    expect(
      findNumbersDeletedFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: withoutFirst,
        numbersInPhoneAtLastSync: undefined,
      })
    ).toEqual(Option.none())
  })

  it("can't tell when too many numbers are missing at once", () => {
    expect(
      findNumbersDeletedFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: rawNumbersOf(contacts.slice(11)),
        numbersInPhoneAtLastSync,
      })
    ).toEqual(Option.none())
  })

  it("can't tell while an address book entry is not stored and normalized yet", () => {
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
      })
    ).toEqual(Option.none())
    expect(
      findNumbersDeletedFromPhone({
        storedContacts: contacts,
        rawNumbersOnDevice: new Set([...withoutFirst, '777 000 0000']),
        numbersInPhoneAtLastSync,
      })
    ).toEqual(Option.none())
  })

  it.each([
    [phoneNumber(0), '+420 777\u2011000\u2011000'],
    [phoneNumber(0), `Work: ${phoneNumber(0)},1234`],
    [phoneNumber(0), `${phoneNumber(0)}-12`],
    [phoneNumber(0), `${phoneNumber(0)} (99)`],
    [phoneNumber(0), `${phoneNumber(0)}/12`],
    [phoneNumber(0), '777 000 000 kl. 12'],
    ['+3546123456', '612 3456-12'],
    ['+3546123456', '+354 (0)612 3456'],
    ['+5491123456789', '011 15 2345-6789 ext. 12'],
  ])(
    'does not count %s as deleted while %s is in the phone',
    (number, rawNumber) => {
      const others = phoneContacts(4).slice(1)
      const remembered = [...others, contact({rawNumber: number})]
      const reformatted = contact({
        rawNumber,
        normalized: false,
        invalidNumber: 'invalid',
      })

      expect(
        findNumbersDeletedFromPhone({
          storedContacts: [...remembered, reformatted],
          rawNumbersOnDevice: rawNumbersOf([...others, reformatted]),
          numbersInPhoneAtLastSync: remembered.map(numberOf),
        })
      ).toEqual(Option.some(new Set()))
    }
  )
})

describe('addNumbersInPhone', () => {
  it('adds newly seen numbers and keeps the rest', () => {
    const second = contact({rawNumber: phoneNumber(1)})

    expect(
      addNumbersInPhone(
        [toE164(phoneNumber(0))],
        [second],
        rawNumbersOf([second])
      )
    ).toEqual([toE164(phoneNumber(0)), toE164(phoneNumber(1))])
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

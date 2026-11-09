import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Option, Schema} from 'effect'
import {
  selectNumbersToRemove,
  syncStoredContactsWithDevice,
} from './deviceContactsSync'
import {type StoredContact} from './domain'

function contact({
  rawNumber,
  normalizedNumber = rawNumber,
  imported = false,
  importedManually = false,
}: {
  readonly rawNumber: string
  readonly normalizedNumber?: string
  readonly imported?: boolean
  readonly importedManually?: boolean
}): StoredContact {
  return {
    info: {
      name: rawNumber,
      label: Option.none(),
      nonUniqueContactId: Option.none(),
      numberToDisplay: rawNumber,
      rawNumber,
    },
    computedValues: Option.some({
      normalizedNumber: Schema.decodeSync(E164PhoneNumber)(normalizedNumber),
      hash: Schema.decodeSync(HashedPhoneNumber)(`hash-${normalizedNumber}`),
    }),
    serverHashToClient: Option.none(),
    flags: {seen: true, imported, importedManually, invalidNumber: 'valid'},
  }
}

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

const storedContacts = [
  onPhone,
  deletedInactive,
  deletedActive,
  vexlOnly,
  vexlContactSavedToPhone,
  sameNumberReformatted,
  sameNumberOnPhone,
]

const deviceRawNumbers = new Set([
  onPhone.info.rawNumber,
  vexlContactSavedToPhone.info.rawNumber,
  sameNumberOnPhone.info.rawNumber,
])

describe('syncStoredContactsWithDevice', () => {
  it('drops inactive deleted contacts, keeps active and Vexl ones and turns contacts on the phone into phone contacts', () => {
    const result = syncStoredContactsWithDevice(
      storedContacts,
      deviceRawNumbers
    )

    expect(result.map((one) => one.info.rawNumber)).toEqual([
      onPhone.info.rawNumber,
      deletedActive.info.rawNumber,
      vexlOnly.info.rawNumber,
      vexlContactSavedToPhone.info.rawNumber,
      sameNumberReformatted.info.rawNumber,
      sameNumberOnPhone.info.rawNumber,
    ])
    expect(
      result.find(
        (one) => one.info.rawNumber === vexlContactSavedToPhone.info.rawNumber
      )?.flags.importedManually
    ).toBe(false)
  })

  it('changes nothing when the address book read is empty', () => {
    expect(syncStoredContactsWithDevice(storedContacts, new Set())).toBe(
      storedContacts
    )
  })
})

const number = (i: number): E164PhoneNumber =>
  Schema.decodeSync(E164PhoneNumber)(`+42077700${String(i).padStart(4, '0')}`)

const numbers = (count: number): E164PhoneNumber[] =>
  Array.from({length: count}, (_, i) => number(i))

describe('selectNumbersToRemove', () => {
  const inPhoneBefore = number(0)
  const neverInPhone = number(1)

  it('removes only numbers that were in the phone at the last sync', () => {
    expect(
      selectNumbersToRemove({
        numbersRemovedFromPhone: [inPhoneBefore, neverInPhone],
        numbersInPhoneAtLastSync: [inPhoneBefore],
        activeContactsCount: 100,
      })
    ).toEqual([inPhoneBefore])
  })

  it('removes nothing on the first sync', () => {
    expect(
      selectNumbersToRemove({
        numbersRemovedFromPhone: [inPhoneBefore],
        numbersInPhoneAtLastSync: undefined,
        activeContactsCount: 100,
      })
    ).toEqual([])
  })

  it('removes nothing when too many contacts are missing at once', () => {
    const allNumbers = numbers(500)
    const missing = allNumbers.slice(0, 51)

    expect(
      selectNumbersToRemove({
        numbersRemovedFromPhone: missing,
        numbersInPhoneAtLastSync: allNumbers,
        activeContactsCount: 500,
      })
    ).toEqual([])
    expect(
      selectNumbersToRemove({
        numbersRemovedFromPhone: missing.slice(0, 50),
        numbersInPhoneAtLastSync: allNumbers,
        activeContactsCount: 500,
      })
    ).toHaveLength(50)
    expect(
      selectNumbersToRemove({
        numbersRemovedFromPhone: allNumbers.slice(0, 10),
        numbersInPhoneAtLastSync: allNumbers,
        activeContactsCount: 20,
      })
    ).toHaveLength(10)
  })
})

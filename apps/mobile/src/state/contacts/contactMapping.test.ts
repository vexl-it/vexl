import {Option} from 'effect'
import {mapContactsFromSystemToDomain} from './contactMapping'
import {type ContactInfo} from './domain'

function contactAt(contacts: ContactInfo[], index: number): ContactInfo {
  const contact = contacts[index]
  if (contact === undefined) {
    throw new Error(`Missing contact at index ${index}`)
  }

  return contact
}

describe('mapContactsFromSystemToDomain', () => {
  it('maps valid phone rows and derives names from contact name parts', () => {
    const result = mapContactsFromSystemToDomain([
      {
        firstName: ' Alice ',
        id: 'contact-id',
        lastName: ' Smith ',
        phoneNumbers: [
          {
            label: 'mobile',
            number: '+420 777 111 222',
          },
        ],
      },
    ])

    const contact = contactAt(result.contacts, 0)

    expect(result.contacts).toHaveLength(1)
    expect(result.malformedContactsCount).toBe(0)
    expect(result.malformedPhoneNumbersCount).toBe(0)
    expect(contact.name).toBe('Alice Smith')
    expect(contact.numberToDisplay).toBe('+420 777 111 222')
    expect(contact.rawNumber).toBe('+420 777 111 222')
    expect(Option.isSome(contact.label)).toBe(true)
    expect(Option.isSome(contact.nonUniqueContactId)).toBe(true)
  })

  it('falls back to phone number when contact has no usable name', () => {
    const result = mapContactsFromSystemToDomain([
      {
        name: '   ',
        phoneNumbers: [{number: '+420 777 111 222'}],
      },
    ])

    const contact = contactAt(result.contacts, 0)

    expect(contact.name).toBe('+420 777 111 222')
  })

  it('skips malformed contacts and malformed phone rows', () => {
    const result = mapContactsFromSystemToDomain([
      {
        name: 'Valid',
        phoneNumbers: [
          {number: '+420 777 111 222'},
          {number: 12345},
          {label: 'missing-number'},
          null,
        ],
      },
      42,
      {phoneNumbers: 'not-an-array'},
      {phoneNumbers: null},
    ])

    const contact = contactAt(result.contacts, 0)

    expect(result.contacts).toHaveLength(1)
    expect(contact.rawNumber).toBe('+420 777 111 222')
    expect(result.malformedContactsCount).toBe(2)
    expect(result.malformedPhoneNumbersCount).toBe(3)
  })

  it('does not throw when a native contact id is not a string', () => {
    const result = mapContactsFromSystemToDomain([
      {
        id: {malformed: true},
        name: 'Valid',
        phoneNumbers: [{number: '+420 777 111 222'}],
      },
    ])

    const contact = contactAt(result.contacts, 0)

    expect(result.contacts).toHaveLength(1)
    expect(Option.isNone(contact.nonUniqueContactId)).toBe(true)
  })
})

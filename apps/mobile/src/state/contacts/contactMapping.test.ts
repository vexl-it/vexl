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
    expect(contact.kind).toBe('phone')
    expect(contact.rawValue).toBe('+420 777 111 222')
    expect(Option.isSome(contact.label)).toBe(true)
    expect(Option.isSome(contact.nonUniqueContactId)).toBe(true)
  })

  it('maps emails to their own rows sharing the contact name and id', () => {
    const result = mapContactsFromSystemToDomain([
      {
        id: 'contact-id',
        name: 'Alice',
        phoneNumbers: [{number: '+420 777 111 222'}],
        emails: [
          {label: 'work', address: ' Alice@Example.com '},
          {address: 'alice.home@example.com'},
        ],
      },
    ])

    expect(result.contacts).toHaveLength(3)
    expect(result.malformedEmailsCount).toBe(0)

    const workEmail = contactAt(result.contacts, 1)
    const homeEmail = contactAt(result.contacts, 2)

    expect(workEmail.kind).toBe('email')
    expect(workEmail.name).toBe('Alice')
    expect(workEmail.rawValue).toBe('Alice@Example.com')
    expect(Option.isSome(workEmail.label)).toBe(true)
    expect(workEmail.nonUniqueContactId).toEqual(
      contactAt(result.contacts, 0).nonUniqueContactId
    )
    expect(homeEmail.rawValue).toBe('alice.home@example.com')
  })

  it('maps a contact with only emails and falls back to the email as name', () => {
    const result = mapContactsFromSystemToDomain([
      {emails: [{address: 'anon@example.com'}]},
    ])

    const contact = contactAt(result.contacts, 0)

    expect(result.contacts).toHaveLength(1)
    expect(contact.kind).toBe('email')
    expect(contact.name).toBe('anon@example.com')
  })

  it('skips malformed email rows', () => {
    const result = mapContactsFromSystemToDomain([
      {
        name: 'Valid',
        emails: [
          {address: 'valid@example.com'},
          {address: 42},
          {label: 'x'},
          null,
        ],
      },
    ])

    expect(result.contacts).toHaveLength(1)
    expect(result.malformedEmailsCount).toBe(3)
  })

  it('trims raw phone numbers before using them as contact identity', () => {
    const result = mapContactsFromSystemToDomain([
      {
        name: 'Alice',
        phoneNumbers: [{number: '  +420 777 111 222  '}],
      },
    ])

    const contact = contactAt(result.contacts, 0)

    expect(contact.name).toBe('Alice')
    expect(contact.rawValue).toBe('+420 777 111 222')
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
    expect(contact.rawValue).toBe('+420 777 111 222')
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

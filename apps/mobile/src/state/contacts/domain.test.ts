import {Option, Schema} from 'effect'
import {StoredContact} from './domain'

describe('StoredContact', () => {
  it('decodes rows persisted before email contacts as phone rows', () => {
    const contact = Schema.decodeUnknownSync(StoredContact)({
      info: {
        name: 'Alice',
        numberToDisplay: '+420 777 111 222',
        rawNumber: '+420 777 111 222',
      },
      computedValues: {
        normalizedNumber: '+420777111222',
        hash: 'hash',
      },
      flags: {
        seen: true,
        imported: true,
        importedManually: false,
        invalidNumber: 'valid',
      },
    })

    expect(contact.info.kind).toBe('phone')
    expect(contact.info.rawValue).toBe('+420 777 111 222')
    expect(
      Option.map(contact.computedValues, (one) => one.normalizedValue)
    ).toEqual(Option.some('+420777111222'))
  })

  it('round-trips email rows through the persisted shape', () => {
    const contact = Schema.decodeUnknownSync(StoredContact)({
      info: {kind: 'email', name: 'Alice', rawNumber: 'Alice@Example.com'},
      computedValues: {normalizedNumber: 'alice@example.com', hash: 'hash'},
    })

    expect(contact.info.kind).toBe('email')
    expect(Schema.encodeSync(StoredContact)(contact)).toMatchObject({
      info: {kind: 'email', rawNumber: 'Alice@Example.com'},
      computedValues: {normalizedNumber: 'alice@example.com'},
    })
  })
})

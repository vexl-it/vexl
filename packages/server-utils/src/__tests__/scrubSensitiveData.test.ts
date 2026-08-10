import {
  SCRUBBED_PLACEHOLDER,
  scrubSensitiveDataInPlace,
  scrubSensitiveString,
} from '@vexl-next/generic-utils/src/scrubSensitiveData'

describe('scrubSensitiveString', () => {
  it('scrubs E.164 phone numbers', () => {
    expect(scrubSensitiveString('user +420777123456 failed')).toEqual(
      `user ${SCRUBBED_PLACEHOLDER} failed`
    )
  })

  it('scrubs PEM key blocks', () => {
    const pem =
      '-----BEGIN PRIVATE KEY-----\nabc\ndef\n-----END PRIVATE KEY-----'
    expect(scrubSensitiveString(`error with ${pem} inside`)).toEqual(
      `error with ${SCRUBBED_PLACEHOLDER} inside`
    )
  })

  it('keeps timezone offsets and short numbers', () => {
    expect(scrubSensitiveString('2024-01-01T10:00:00+02:00 count +42')).toEqual(
      '2024-01-01T10:00:00+02:00 count +42'
    )
  })
})

describe('scrubSensitiveDataInPlace', () => {
  it('replaces values under sensitive keys', () => {
    const value = {
      notificationToken: 'abc',
      userHash: 'def',
      publicKey: 'ghi',
      nested: {authorization: 'Bearer xyz'},
      safe: 'ok',
    }
    scrubSensitiveDataInPlace(value)
    expect(value).toEqual({
      notificationToken: SCRUBBED_PLACEHOLDER,
      userHash: SCRUBBED_PLACEHOLDER,
      publicKey: SCRUBBED_PLACEHOLDER,
      nested: {authorization: SCRUBBED_PLACEHOLDER},
      safe: 'ok',
    })
  })

  it('scrubs strings inside arrays and nested objects', () => {
    const value = {
      messages: ['call +420777123456', {detail: 'phone: +12025550123'}],
    }
    scrubSensitiveDataInPlace(value)
    expect(value).toEqual({
      messages: [
        `call ${SCRUBBED_PLACEHOLDER}`,
        {detail: `phone: ${SCRUBBED_PLACEHOLDER}`},
      ],
    })
  })

  it('handles circular references', () => {
    const value: Record<string, unknown> = {safe: 'ok'}
    value.self = value
    expect(() => {
      scrubSensitiveDataInPlace(value)
    }).not.toThrow()
    expect(value.safe).toEqual('ok')
  })
})

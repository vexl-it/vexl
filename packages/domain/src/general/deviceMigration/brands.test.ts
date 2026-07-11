import {Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {
  HumanAuthCode,
  ManifestDigest,
  MigrationKeyExchangePublicKey,
  QrAuthMac,
  TransferId,
} from './brands'

describe('random-bytes brands (base64url of 32 bytes)', () => {
  const decode = Schema.decodeUnknownEither(TransferId)

  it('accepts 43 url-safe base64 characters', () => {
    expect(Either.isRight(decode('A'.repeat(43)))).toBe(true)
    expect(Either.isRight(decode(`${'a'.repeat(41)}_-`))).toBe(true)
  })

  it('rejects wrong lengths and non-url-safe characters', () => {
    expect(Either.isLeft(decode('A'.repeat(42)))).toBe(true)
    expect(Either.isLeft(decode('A'.repeat(44)))).toBe(true)
    expect(Either.isLeft(decode(`${'A'.repeat(42)}+`))).toBe(true)
    expect(Either.isLeft(decode(`${'A'.repeat(42)}=`))).toBe(true)
    expect(Either.isLeft(decode(''))).toBe(true)
    expect(Either.isLeft(decode(42))).toBe(true)
  })
})

describe('sha256 hex digest brands', () => {
  const decode = Schema.decodeUnknownEither(ManifestDigest)

  it('accepts 64 lowercase hex characters', () => {
    expect(Either.isRight(decode('0123456789abcdef'.repeat(4)))).toBe(true)
  })

  it('rejects uppercase, wrong length and non-hex input', () => {
    expect(Either.isLeft(decode('0123456789ABCDEF'.repeat(4)))).toBe(true)
    expect(Either.isLeft(decode('a'.repeat(63)))).toBe(true)
    expect(Either.isLeft(decode('a'.repeat(65)))).toBe(true)
    expect(Either.isLeft(decode('g'.repeat(64)))).toBe(true)
  })
})

describe('32-byte base64 brands (key exchange public key, MAC)', () => {
  const decodeKey = Schema.decodeUnknownEither(MigrationKeyExchangePublicKey)
  const decodeMac = Schema.decodeUnknownEither(QrAuthMac)

  it('accepts base64 that decodes to exactly 32 bytes', () => {
    const valid = Base64.fromUint8Array(new Uint8Array(32).fill(1))
    expect(Either.isRight(decodeKey(valid))).toBe(true)
    expect(Either.isRight(decodeMac(valid))).toBe(true)
  })

  it('rejects base64 of other byte lengths and invalid base64', () => {
    expect(
      Either.isLeft(decodeKey(Base64.fromUint8Array(new Uint8Array(31))))
    ).toBe(true)
    expect(
      Either.isLeft(decodeKey(Base64.fromUint8Array(new Uint8Array(33))))
    ).toBe(true)
    expect(Either.isLeft(decodeKey('!not-base64!'))).toBe(true)
    expect(Either.isLeft(decodeKey(''))).toBe(true)
  })
})

describe('HumanAuthCode', () => {
  const decode = Schema.decodeUnknownEither(HumanAuthCode)

  it('accepts exactly six digits', () => {
    expect(Either.isRight(decode('000000'))).toBe(true)
    expect(Either.isRight(decode('123456'))).toBe(true)
  })

  it('rejects everything else', () => {
    expect(Either.isLeft(decode('12345'))).toBe(true)
    expect(Either.isLeft(decode('1234567'))).toBe(true)
    expect(Either.isLeft(decode('12345a'))).toBe(true)
    expect(Either.isLeft(decode(123456))).toBe(true)
  })
})

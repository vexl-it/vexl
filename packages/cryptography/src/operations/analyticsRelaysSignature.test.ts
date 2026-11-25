import {generateKeyPairSync} from 'node:crypto'
import {
  canonicalJson,
  isAnalyticsRelaysSignatureValid,
  signAnalyticsRelays,
} from './analyticsRelaysSignature'
import {rsaSha256Sign} from './rsa'

const generateKey = (): {privateKeyPem: string; publicKeyPem: string} => {
  const {privateKey, publicKey} = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })
  return {
    privateKeyPem: privateKey.export({type: 'pkcs8', format: 'pem'}).toString(),
    publicKeyPem: publicKey.export({type: 'spki', format: 'pem'}).toString(),
  }
}

const main = generateKey()
const publicKeys = {main: main.publicKeyPem}
const file = {
  revision: 3,
  prod: {relayUrls: ['https://relay.test/a'], gatewayKeyConfig: 'key'},
}
const signed = signAnalyticsRelays({
  file,
  keyId: 'main',
  privateKeyPem: main.privateKeyPem,
})

describe('canonicalJson', () => {
  it('sorts object keys at every depth and keeps array order', () => {
    expect(canonicalJson({b: [{d: 1, c: 2}, 'x'], a: null})).toBe(
      '{"a":null,"b":[{"c":2,"d":1},"x"]}'
    )
  })
})

describe('analytics relays signature', () => {
  it('accepts a signed file, however it is formatted or ordered', () => {
    const reordered: unknown = JSON.parse(
      JSON.stringify(
        {signatures: signed.signatures, prod: file.prod, revision: 3},
        null,
        4
      )
    )

    expect(isAnalyticsRelaysSignatureValid(signed, publicKeys)).toBe(true)
    expect(isAnalyticsRelaysSignatureValid(reordered, publicKeys)).toBe(true)
  })

  it('rejects a file changed after signing, also by a field old apps do not know', () => {
    expect(
      isAnalyticsRelaysSignatureValid({...signed, revision: 4}, publicKeys)
    ).toBe(false)
    expect(
      isAnalyticsRelaysSignatureValid({...signed, future: true}, publicKeys)
    ).toBe(false)
  })

  it('rejects an unsigned file, a broken signature and anything that is not an object', () => {
    expect(isAnalyticsRelaysSignatureValid(file, publicKeys)).toBe(false)
    expect(
      isAnalyticsRelaysSignatureValid(
        {...file, signatures: {main: 'not a signature'}},
        publicKeys
      )
    ).toBe(false)
    expect(isAnalyticsRelaysSignatureValid('{}', publicKeys)).toBe(false)
  })

  it('rejects a signature by a key the app does not trust', () => {
    const other = generateKey()
    const signedByOther = signAnalyticsRelays({
      file,
      keyId: 'main',
      privateKeyPem: other.privateKeyPem,
    })

    expect(isAnalyticsRelaysSignatureValid(signedByOther, publicKeys)).toBe(
      false
    )
    expect(isAnalyticsRelaysSignatureValid(signed)).toBe(false)
  })

  it('rejects the bare file content signed without the relays context, as an update manifest would be', () => {
    const signature = rsaSha256Sign({
      message: canonicalJson(file),
      privateKeyPem: main.privateKeyPem,
    })

    expect(
      isAnalyticsRelaysSignatureValid(
        {...file, signatures: {main: signature}},
        publicKeys
      )
    ).toBe(false)
  })

  it('keeps the signatures of other keys when signing, so old and new apps both verify', () => {
    const next = generateKey()
    const signedByBoth = signAnalyticsRelays({
      file: signed,
      keyId: 'next',
      privateKeyPem: next.privateKeyPem,
    })

    expect(isAnalyticsRelaysSignatureValid(signedByBoth, publicKeys)).toBe(true)
    expect(
      isAnalyticsRelaysSignatureValid(signedByBoth, {next: next.publicKeyPem})
    ).toBe(true)
  })
})

import PublicKey from './PublicKey'
import KeyFormat from './KeyFormat'

describe('should generate a valid public key', () => {
  // Private key rawKey: "z0Rnt3qw5X4SemjiuBf1aPz25GuQGne/YjNF0g==",
  const pubKey = {
    pemKey:
      '-----BEGIN PUBLIC KEY-----\n' +
      'ME4wEAYHKoZIzj0CAQYFK4EEACEDOgAEO8uxByJAyNUrRDXxAu67T0snQZisM+5C\n' +
      'mF3Vi2t/BeP5qy5V/trZqy/CTzAt3BAUx1R1frTolQY=\n' +
      '-----END PUBLIC KEY-----\n',
    pemBase64:
      'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVPOHV4QnlKQXlOVXJSRFh4QXU2N1Qwc25RWmlzTSs1QwptRjNWaTJ0L0JlUDVxeTVWL3RyWnF5L0NUekF0M0JBVXgxUjFmclRvbFFZPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K',
    rawKey:
      'BDvLsQciQMjVK0Q18QLuu09LJ0GYrDPuQphd1YtrfwXj+asuVf7a2asvwk8wLdwQFMdUdX606JUG',
  }

  it('From Raw key', () => {
    const publicKeyFromRaw = PublicKey.import({
      key: pubKey.rawKey,
      type: KeyFormat.RAW,
    })

    expect(publicKeyFromRaw.exportPublicKey(KeyFormat.PEM)).toEqual(
      pubKey.pemKey
    )
    expect(publicKeyFromRaw.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
      pubKey.pemBase64
    )
    expect(publicKeyFromRaw.exportPublicKey(KeyFormat.RAW)).toEqual(
      pubKey.rawKey
    )
  })

  it('From pem key', () => {
    const publicKeyFromPem = PublicKey.import({
      key: pubKey.pemKey,
      type: KeyFormat.PEM,
    })
    expect(publicKeyFromPem.exportPublicKey(KeyFormat.PEM)).toEqual(
      pubKey.pemKey
    )
    expect(publicKeyFromPem.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
      pubKey.pemBase64
    )
    expect(publicKeyFromPem.exportPublicKey(KeyFormat.RAW)).toEqual(
      pubKey.rawKey
    )
  })

  it('From pem in base64 key', () => {
    const publicKeyFromPemBase64 = PublicKey.import({
      key: pubKey.pemBase64,
      type: KeyFormat.PEM_BASE64,
    })
    expect(publicKeyFromPemBase64.exportPublicKey(KeyFormat.PEM)).toEqual(
      pubKey.pemKey
    )
    expect(
      publicKeyFromPemBase64.exportPublicKey(KeyFormat.PEM_BASE64)
    ).toEqual(pubKey.pemBase64)
    expect(publicKeyFromPemBase64.exportPublicKey(KeyFormat.RAW)).toEqual(
      pubKey.rawKey
    )
  })
})

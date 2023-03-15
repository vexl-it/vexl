import {generatePrivateKey, importPrivateKey, importPublicKey} from './index'
import {
  PrivateKeyPemBase64,
  PrivateKeyRaw,
  PublicKeyPemBase64,
  PublicKeyRaw,
} from './brands'

describe('private key', () => {
  // Private key rawKey: "z0Rnt3qw5X4SemjiuBf1aPz25GuQGne/YjNF0g==",
  const privKey = {
    privateKeyPemBase64:
      'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhLVWRKY3RyS2w0VlBCMTFPQmJtbHAKQzFkQWhoVzlhV0NxM2VlcG9Ud0RPZ0FFNFd0MVAyQ2dVczdEYjJLK1lLNUZ1cGY3NGpWa0o4aW5nSGRJUlpVWQpDSmQ1aFZCTXJRY0dFK2dyRFhDdlpMc29zZkp2M0dRdTc1QT0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=',
    privateKeyRaw: 'SlHSXLaypeFTwddTgW5paQtXQIYVvWlgqt3nqQ==',
    publicKeyPemBase64:
      'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUU0V3QxUDJDZ1VzN0RiMksrWUs1RnVwZjc0alZrSjhpbgpnSGRJUlpVWUNKZDVoVkJNclFjR0UrZ3JEWEN2Wkxzb3NmSnYzR1F1NzVBPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K',
    publicKeyRaw:
      'BOFrdT9goFLOw29ivmCuRbqX++I1ZCfIp4B3SEWVGAiXeYVQTK0HBhPoKw1wr2S7KLHyb9xkLu+Q',
  }

  it('from raw key', () => {
    const keyHolder = importPrivateKey({
      privateKeyRaw: PrivateKeyRaw.parse(privKey.privateKeyRaw),
    })

    expect(keyHolder).toEqual(privKey)
  })

  it('from pem key', () => {
    const keyHolder = importPrivateKey({
      privateKeyPemBase64: PrivateKeyPemBase64.parse(
        privKey.privateKeyPemBase64
      ),
    })

    expect(keyHolder).toEqual(privKey)
  })

  it('generates key properly', () => {
    const keyHolder = generatePrivateKey()
    const importedPrivatekey = importPrivateKey({
      privateKeyRaw: keyHolder.privateKeyRaw,
    })

    expect(importedPrivatekey).toEqual(keyHolder)

    const importedPublicKey = importPublicKey({
      publicKeyRaw: keyHolder.publicKeyRaw,
    })
    expect(importedPublicKey).toEqual({
      publicKeyPemBase64: keyHolder.publicKeyPemBase64,
      publicKeyRaw: keyHolder.publicKeyRaw,
    })
  })
})

describe('Public key', () => {
  // Private key rawKey: "z0Rnt3qw5X4SemjiuBf1aPz25GuQGne/YjNF0g==",
  const pubKey = {
    publicKeyPemBase64:
      'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVPOHV4QnlKQXlOVXJSRFh4QXU2N1Qwc25RWmlzTSs1QwptRjNWaTJ0L0JlUDVxeTVWL3RyWnF5L0NUekF0M0JBVXgxUjFmclRvbFFZPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K',
    publicKeyRaw:
      'BDvLsQciQMjVK0Q18QLuu09LJ0GYrDPuQphd1YtrfwXj+asuVf7a2asvwk8wLdwQFMdUdX606JUG',
  }

  it('from raw key', () => {
    const keyHolder = importPublicKey({
      publicKeyRaw: PublicKeyRaw.parse(pubKey.publicKeyRaw),
    })

    expect(keyHolder).toEqual(pubKey)
  })

  it('from pem key', () => {
    const keyHolder = importPublicKey({
      publicKeyPemBase64: PublicKeyPemBase64.parse(pubKey.publicKeyPemBase64),
    })

    expect(keyHolder).toEqual(pubKey)
  })
})

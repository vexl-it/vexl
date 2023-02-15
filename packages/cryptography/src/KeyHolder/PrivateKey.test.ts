import PrivateKey from './PrivateKey'
import KeyFormat from './KeyFormat'

const privKey = {
  privateKey: {
    pemKey:
      '-----BEGIN PRIVATE KEY-----\n' +
      'MHgCAQAwEAYHKoZIzj0CAQYFK4EEACEEYTBfAgEBBBxKUdJctrKl4VPB11OBbmlp\n' +
      'C1dAhhW9aWCq3eepoTwDOgAE4Wt1P2CgUs7Db2K+YK5Fupf74jVkJ8ingHdIRZUY\n' +
      'CJd5hVBMrQcGE+grDXCvZLsosfJv3GQu75A=\n' +
      '-----END PRIVATE KEY-----\n',
    pemBase64:
      'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhLVWRKY3RyS2w0VlBCMTFPQmJtbHAKQzFkQWhoVzlhV0NxM2VlcG9Ud0RPZ0FFNFd0MVAyQ2dVczdEYjJLK1lLNUZ1cGY3NGpWa0o4aW5nSGRJUlpVWQpDSmQ1aFZCTXJRY0dFK2dyRFhDdlpMc29zZkp2M0dRdTc1QT0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=',
    rawKey: 'SlHSXLaypeFTwddTgW5paQtXQIYVvWlgqt3nqQ==',
  },
  publicKey: {
    pemKey:
      '-----BEGIN PUBLIC KEY-----\n' +
      'ME4wEAYHKoZIzj0CAQYFK4EEACEDOgAE4Wt1P2CgUs7Db2K+YK5Fupf74jVkJ8in\n' +
      'gHdIRZUYCJd5hVBMrQcGE+grDXCvZLsosfJv3GQu75A=\n' +
      '-----END PUBLIC KEY-----\n',
    pemBase64:
      'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUU0V3QxUDJDZ1VzN0RiMksrWUs1RnVwZjc0alZrSjhpbgpnSGRJUlpVWUNKZDVoVkJNclFjR0UrZ3JEWEN2Wkxzb3NmSnYzR1F1NzVBPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K',
    rawKey:
      'BOFrdT9goFLOw29ivmCuRbqX++I1ZCfIp4B3SEWVGAiXeYVQTK0HBhPoKw1wr2S7KLHyb9xkLu+Q',
  },
}

describe('should generate a valid private key', () => {
  it('From Raw key', () => {
    const key = PrivateKey.import({
      key: privKey.privateKey.rawKey,
      type: KeyFormat.RAW,
    })

    expect(key.exportPrivateKey(KeyFormat.PEM)).toEqual(
      privKey.privateKey.pemKey
    )
    expect(key.exportPrivateKey(KeyFormat.PEM_BASE64)).toEqual(
      privKey.privateKey.pemBase64
    )
    expect(key.exportPrivateKey(KeyFormat.RAW)).toEqual(
      privKey.privateKey.rawKey
    )
    expect(key.exportPublicKey(KeyFormat.PEM)).toEqual(privKey.publicKey.pemKey)
    expect(key.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
      privKey.publicKey.pemBase64
    )
    expect(key.exportPublicKey(KeyFormat.RAW)).toEqual(privKey.publicKey.rawKey)
  })
  it('From pem key', () => {
    const key = PrivateKey.import({
      key: privKey.privateKey.pemKey,
      type: KeyFormat.PEM,
    })
    expect(key.exportPrivateKey(KeyFormat.PEM)).toEqual(
      privKey.privateKey.pemKey
    )
    expect(key.exportPrivateKey(KeyFormat.PEM_BASE64)).toEqual(
      privKey.privateKey.pemBase64
    )
    expect(key.exportPrivateKey(KeyFormat.RAW)).toEqual(
      privKey.privateKey.rawKey
    )
    expect(key.exportPublicKey(KeyFormat.PEM)).toEqual(privKey.publicKey.pemKey)
    expect(key.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
      privKey.publicKey.pemBase64
    )
    expect(key.exportPublicKey(KeyFormat.RAW)).toEqual(privKey.publicKey.rawKey)
  })
  it('From pem in base64 key', () => {
    const key = PrivateKey.import({
      key: privKey.privateKey.pemBase64,
      type: KeyFormat.PEM_BASE64,
    })
    expect(key.exportPrivateKey(KeyFormat.PEM)).toEqual(
      privKey.privateKey.pemKey
    )
    expect(key.exportPrivateKey(KeyFormat.PEM_BASE64)).toEqual(
      privKey.privateKey.pemBase64
    )
    expect(key.exportPrivateKey(KeyFormat.RAW)).toEqual(
      privKey.privateKey.rawKey
    )
    expect(key.exportPublicKey(KeyFormat.PEM)).toEqual(privKey.publicKey.pemKey)
    expect(key.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
      privKey.publicKey.pemBase64
    )
    expect(key.exportPublicKey(KeyFormat.RAW)).toEqual(privKey.publicKey.rawKey)
  })
})

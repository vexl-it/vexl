import {generatePrivateKey, importPrivateKey} from './index'
import {PrivateKeyPemBase64} from './brands'

// Todo test curves
describe('private key', () => {
  // Private key rawKey: "z0Rnt3qw5X4SemjiuBf1aPz25GuQGne/YjNF0g==",
  const privKey = {
    privateKeyPemBase64:
      'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhLVWRKY3RyS2w0VlBCMTFPQmJtbHAKQzFkQWhoVzlhV0NxM2VlcG9Ud0RPZ0FFNFd0MVAyQ2dVczdEYjJLK1lLNUZ1cGY3NGpWa0o4aW5nSGRJUlpVWQpDSmQ1aFZCTXJRY0dFK2dyRFhDdlpMc29zZkp2M0dRdTc1QT0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=',
    publicKeyPemBase64:
      'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUU0V3QxUDJDZ1VzN0RiMksrWUs1RnVwZjc0alZrSjhpbgpnSGRJUlpVWUNKZDVoVkJNclFjR0UrZ3JEWEN2Wkxzb3NmSnYzR1F1NzVBPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K',
  }

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
      privateKeyPemBase64: keyHolder.privateKeyPemBase64,
    })

    expect(importedPrivatekey).toEqual(keyHolder)
  })
})

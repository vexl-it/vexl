import {KeyFormat, PrivateKey} from '../KeyHolder'
import {eciesLegacyDecrypt, eciesLegacyEncrypt} from './eciesLegacy'

it('Should decrypt message as expected', async () => {
  const privateKey = PrivateKey.import({
    key: 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhJWTl5Q3prMU4vWXU3UFZlbVJWc1QKTStCYjFMODRWbDNUZ2QvMm9Ud0RPZ0FFWUFxNWc5RGxBZ1VSWHUvc3JKQnByRWNnYlp3cDBJL2xudjgvR2NQNApGeU92YkorQXZ1RzZjL1pXR0lldUVSVXpKVlZIZzVyVjRRND0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=',
    type: KeyFormat.PEM_BASE64,
  })

  const cipher =
    '172Ar+8ScAMaOn02z6bkOcUtorl6DtxHpXbWsBETrqYvhejx4090WFpLkuhoyzTypfq0woiNm/crqBU9Gw54w2h3qD1BhFwI0TwqUg9grhRd2X/mos4R6V1FtL9O7KAkg4cT72NX3KzWJ74mEjYDPMq8UUtL8ea5bHJgeS88SKivNEY=44AoDQx3spJHWDcfV5iIwT+aU7AAgNMcGCDg9iiS+NNQbU=40AA2NBtH0bhf2o39IF45r5NufcYF8G5m16LqZPSso='

  const message = await eciesLegacyDecrypt({
    privateKey,
    data: cipher,
  })

  expect(message).toEqual('Test message')
})

it('Should encrypt and decrypt message', async () => {
  const keyOfReceiver = PrivateKey.generate()

  const message =
    'Test message that is really really long, Test message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really longTest message that is really really long'

  const cipher = await eciesLegacyEncrypt({
    publicKey: keyOfReceiver,
    data: message,
  })

  const decryptedMessage = await eciesLegacyDecrypt({
    privateKey: keyOfReceiver,
    data: cipher,
  })

  expect(decryptedMessage).toEqual(message)
})

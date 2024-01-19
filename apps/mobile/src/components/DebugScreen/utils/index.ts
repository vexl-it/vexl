import {aes, ecdsa, eciesLegacy} from '@vexl-next/cryptography'
import {
  PrivateKeyPemBase64,
  generatePrivateKey,
  importPrivateKey,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  eciesLegacyDecrypt,
  eciesLegacyEncrypt,
} from '@vexl-next/cryptography/src/operations/eciesLegacy'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {hashPhoneNumber} from '../../../state/contacts/utils'

const dummyPrivatePart = `"privatePart": {"commonFriends": [MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+],"friendLevel": ["NOT_SPECIFIED"],"symmetricKey": "MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+RG0="},`
const dummyPublicPart = `"publicPart": {"offerPublicKey": "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K",      "location": [        {          "longitude": "14.4212535000000006135678631835617125034332275390625",          "latitude": "50.0874653999999992493030731566250324249267578125",          "city": "Prague"        }      ],      "offerDescription": "test",      "amountBottomLimit": 0,      "amountTopLimit": 250000,      "feeState": "WITHOUT_FEE",      "feeAmount": 1,      "locationState": "ONLINE",      "paymentMethod": [        "CASH"      ],      "btcNetwork": [        "LIGHTING"      ],      "currency": "CZK",      "offerType": "SELL",      "activePriceState": "NONE",      "activePriceValue": 0,      "activePriceCurrency": "CZK",      "active": true,      "groupUuids": []    },`
const dummySymetricKey = 'MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+RG0='
const dummyPhoneNumber = E164PhoneNumber.parse('+420733333333')

export const NUMBER_OF_GENERATIONS = 100

const numberFormatIntl = new Intl.NumberFormat('cs', {})

function msToString(ms: number): string {
  return `${numberFormatIntl.format(ms / 1000)} seconds`
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function* runTests() {
  yield `Tests running`

  yield `generating keypair`
  const keypair1 = generatePrivateKey()

  yield `Testing Ecies`
  const encrypted = await eciesLegacyEncrypt({
    publicKey: keypair1.publicKeyPemBase64,
    data: dummyPrivatePart,
  })
  const decrypted = await eciesLegacyDecrypt({
    privateKey: keypair1.privateKeyPemBase64,
    data: encrypted,
  })

  if (decrypted !== dummyPrivatePart) {
    yield `🚨 ECIES failed`
  } else {
    yield `✅ ECIES OK`
  }

  yield `Testing ECIES decryption with another cypher`
  const cipher =
    '172Ar+8ScAMaOn02z6bkOcUtorl6DtxHpXbWsBETrqYvhejx4090WFpLkuhoyzTypfq0woiNm/crqBU9Gw54w2h3qD1BhFwI0TwqUg9grhRd2X/mos4R6V1FtL9O7KAkg4cT72NX3KzWJ74mEjYDPMq8UUtL8ea5bHJgeS88SKivNEY=44AoDQx3spJHWDcfV5iIwT+aU7AAgNMcGCDg9iiS+NNQbU=40AA2NBtH0bhf2o39IF45r5NufcYF8G5m16LqZPSso='
  const privateKeyForCipher = importPrivateKey({
    privateKeyPemBase64: PrivateKeyPemBase64.parse(
      'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQnhJWTl5Q3prMU4vWXU3UFZlbVJWc1QKTStCYjFMODRWbDNUZ2QvMm9Ud0RPZ0FFWUFxNWc5RGxBZ1VSWHUvc3JKQnByRWNnYlp3cDBJL2xudjgvR2NQNApGeU92YkorQXZ1RzZjL1pXR0lldUVSVXpKVlZIZzVyVjRRND0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo='
    ),
  })
  const decryptedCypher = await eciesLegacyDecrypt({
    privateKey: privateKeyForCipher.privateKeyPemBase64,
    data: cipher,
  })
  if (decryptedCypher !== 'Test message') {
    yield `🚨 ECIES did not decipher as expected.`
  } else {
    yield `✅ ECIES decipher OK`
  }

  yield `Testing AES`
  const encrypted2 = aes.aesGCMIgnoreTagEncrypt({
    data: dummyPublicPart,
    password: dummySymetricKey,
  })
  const decrypted2 = aes.aesGCMIgnoreTagDecrypt({
    data: encrypted2,
    password: dummySymetricKey,
  })
  if (decrypted2 !== dummyPublicPart) {
    yield `🚨  AES failed`
  } else {
    yield `✅ AES OK`
  }

  yield `Testing ECDSA`
  const signature = ecdsa.ecdsaSign({
    privateKey: keypair1,
    challenge: dummySymetricKey,
  })
  if (
    !ecdsa.ecdsaVerify({
      challenge: dummySymetricKey,
      signature,
      pubKey: keypair1.publicKeyPemBase64,
    })
  ) {
    yield `🚨  ECDSA failed`
  } else {
    yield `✅ ECDSA OK`
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function* runBenchmark() {
  const keypair1 = generatePrivateKey()

  const encryptedPrivateParts = []
  // ECIES

  const startedAt = Date.now()
  let nowMs = Date.now()
  yield `ECIES encrypting dummy private parts ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < NUMBER_OF_GENERATIONS; i++) {
    const one = await eciesLegacy.eciesLegacyEncrypt({
      publicKey: keypair1.publicKeyPemBase64,
      data: dummyPrivatePart,
    })
    encryptedPrivateParts.push(one)
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  nowMs = Date.now()
  yield `ECIES decrypting dummy private parts ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < encryptedPrivateParts.length; i++) {
    await eciesLegacy.eciesLegacyDecrypt({
      privateKey: keypair1.privateKeyPemBase64,
      data: encryptedPrivateParts[i] ?? '',
    })
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  nowMs = Date.now()
  const encryptedPublicParts = []
  yield `AES encrypting dummy public parts ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < NUMBER_OF_GENERATIONS; i++) {
    const data = aes.aesGCMIgnoreTagEncrypt({
      data: dummyPublicPart,
      password: dummySymetricKey,
    })
    encryptedPublicParts.push(data)
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  nowMs = Date.now()
  yield `AES decrypting dummy public parts ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < encryptedPublicParts.length; i++) {
    aes.aesGCMIgnoreTagDecrypt({
      data: encryptedPublicParts[i] ?? '',
      password: dummySymetricKey,
    })
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  nowMs = Date.now()
  yield `ECDSA signing dummy phone number ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < NUMBER_OF_GENERATIONS; i++) {
    ecdsa.ecdsaSign({
      privateKey: keypair1,
      challenge: dummySymetricKey,
    })
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  yield `HMAC signing dummy phone number ${NUMBER_OF_GENERATIONS} times`
  nowMs = Date.now()
  for (let i = 0; i < NUMBER_OF_GENERATIONS; i++) {
    hashPhoneNumber(dummyPhoneNumber)
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  yield `Done in ${msToString(Date.now() - startedAt)}!`
}

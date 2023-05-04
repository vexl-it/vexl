import {Text, YStack} from 'tamagui'
import Button from '../../Button'
import {generatePrivateKey} from '@vexl-next/cryptography/dist/KeyHolder'
import {aes, ecdsa, eciesLegacy, hmac} from '@vexl-next/cryptography'
import {useEffect, useState} from 'react'
import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/dist/implementations/ecdhComputeSecret'

const dummyPrivatePart = `"privatePart": {"commonFriends": [MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+],"friendLevel": ["NOT_SPECIFIED"],"symmetricKey": "MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+RG0="},`
const dummyPublicPart = `"publicPart": {"offerPublicKey": "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K",      "location": [        {          "longitude": "14.4212535000000006135678631835617125034332275390625",          "latitude": "50.0874653999999992493030731566250324249267578125",          "city": "Prague"        }      ],      "offerDescription": "test",      "amountBottomLimit": 0,      "amountTopLimit": 250000,      "feeState": "WITHOUT_FEE",      "feeAmount": 1,      "locationState": "ONLINE",      "paymentMethod": [        "CASH"      ],      "btcNetwork": [        "LIGHTING"      ],      "currency": "CZK",      "offerType": "SELL",      "activePriceState": "NONE",      "activePriceValue": 0,      "activePriceCurrency": "CZK",      "active": true,      "groupUuids": []    },`
const dummySymetricKey = 'MEEe3tRp7bx+hRA7osU/x+hhMVy6PiAfBR3Gu2r+RG0='
const dummyPhoneNumber = '+420733333333'

const numberFormatIntl = new Intl.NumberFormat('cs', {})

function msToString(ms: number): string {
  return `${numberFormatIntl.format(ms / 1000)} seconds`
}

const NUMBER_OF_GENERATIONS = 100

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function* runBenchmark() {
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
  const eciesEncryptDuration = Date.now() - nowMs

  nowMs = Date.now()
  yield `ECIES decrypting dummy private parts ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < encryptedPrivateParts.length; i++) {
    await eciesLegacy.eciesLegacyDecrypt({
      privateKey: keypair1.privateKeyPemBase64,
      data: encryptedPrivateParts[i],
    })
  }
  yield `Took ${msToString(Date.now() - nowMs)}`
  const eciesDecryptDuration = Date.now() - nowMs

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
  const aesEncryptDuration = Date.now() - nowMs

  nowMs = Date.now()
  yield `AES decrypting dummy public parts ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < encryptedPublicParts.length; i++) {
    aes.aesGCMIgnoreTagDecrypt({
      data: encryptedPublicParts[i],
      password: dummySymetricKey,
    })
  }
  yield `Took ${msToString(Date.now() - nowMs)}`
  const aesDecryptDuration = Date.now() - nowMs

  nowMs = Date.now()
  yield `ECDSA signing dummy phone number ${NUMBER_OF_GENERATIONS} times`
  for (let i = 0; i < NUMBER_OF_GENERATIONS; i++) {
    ecdsa.ecdsaSign({
      privateKey: keypair1,
      challenge: dummySymetricKey,
    })
  }
  yield `Took ${msToString(Date.now() - nowMs)}`
  const ecdsaSignatureDuration = Date.now() - nowMs

  yield `HMAC signing dummy phone number ${NUMBER_OF_GENERATIONS} times`
  nowMs = Date.now()
  for (let i = 0; i < NUMBER_OF_GENERATIONS; i++) {
    hmac.hmacSign({data: dummyPhoneNumber, password: 'VexlVexl'})
  }
  yield `Took ${msToString(Date.now() - nowMs)}`

  yield `Done in ${msToString(Date.now() - startedAt)}!`
  const hmacDuration = Date.now() - nowMs

  return {
    eciesEncryptDuration: msToString(eciesEncryptDuration),
    eciesDecryptDuration: msToString(eciesDecryptDuration),
    aesEncryptDuration: msToString(aesEncryptDuration),
    aesDecryptDuration: msToString(aesDecryptDuration),
    ecdsaSignatureDuration: msToString(ecdsaSignatureDuration),
    hmacDuration: msToString(hmacDuration),
  }
}

function createDummyImplementation(
  msDelay: number
): typeof defaultImplementation {
  return async () => {
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          publicKey: Buffer.from('aha'),
          secret: Buffer.from('ehe'),
        })
      }, msDelay)
    })
  }
}

// setEcdhComputeSecretImplementation(createDummyImplementation(2))

export default function CryptoBenchmarks(): JSX.Element {
  const [text, setText] = useState('Not started yet')

  function addText(text: string): void {
    setText((prev) => `${prev}\n${text}`)
  }

  useEffect(() => {
    return () => {
      setEcdhComputeSecretImplementation(defaultImplementation)
    }
  }, [])

  return (
    <YStack space={'$2'}>
      <Text fos={20} color={'$black'}>
        For each crypto operation, we run {NUMBER_OF_GENERATIONS} iterations and
        measure the time
      </Text>
      <Text>{text}</Text>
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={async () => {
          setText('')
          const generator = runBenchmark()
          let curr = await generator.next()

          while (!curr.done) {
            console.log(curr.value)
            addText(curr.value)
            curr = await generator.next()
          }
        }}
        variant={'secondary'}
        text={'Start benchmark'}
        small
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(defaultImplementation)
        }}
        variant="primary"
        small
        text="set real implementationo"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(createDummyImplementation(10))
        }}
        variant="primary"
        small
        text="set 10ms implementationo"
      />
      <Button
        onPress={() => {
          setEcdhComputeSecretImplementation(createDummyImplementation(0))
        }}
        variant="primary"
        small
        text="set instant implementationo"
      />
    </YStack>
  )
}

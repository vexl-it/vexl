import React from 'react'
import sodium from 'react-native-libsodium'
import {Text, YStack} from 'tamagui'
import Button from '../../Button'

async function testIt(): Promise<void> {
  await sodium.ready
  const keyPair = sodium.crypto_box_keypair()

  console.log('keypair', {
    publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
    privateKey: Buffer.from(keyPair.privateKey).toString('base64'),
  })

  const encrypted = sodium.crypto_box_seal('hello', keyPair.publicKey)

  console.log('Encrypted message:', Buffer.from(encrypted).toString('base64'))

  const decrypted = sodium.crypto_box_seal_open(
    encrypted,
    keyPair.publicKey,
    keyPair.privateKey
  )

  console.log('decrypted message:', Buffer.from(decrypted).toString('utf-8'))
}

function NewCrypto(): React.ReactElement {
  return (
    <YStack>
      <Text color="$black" fos={25}>
        New crypto
      </Text>
      <Button
        onPress={() => {
          void testIt()
        }}
        variant="primary"
        size="small"
        text="Test it"
      />
    </YStack>
  )
}

export default NewCrypto

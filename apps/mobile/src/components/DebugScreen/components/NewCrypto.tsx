import {Button, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import sodium from 'react-native-libsodium'

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
    <YStack gap="$2">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        New crypto
      </Typography>
      <Button
        onPress={() => {
          void testIt()
        }}
        variant="primary"
        size="small"
      >
        Test it
      </Button>
    </YStack>
  )
}

export default NewCrypto

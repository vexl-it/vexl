import {assertMigrationCryptoSupported} from '@vexl-next/cryptography/src/operations/deviceMigration'
import {Button, Typography, YStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import sodium from 'libsodium-wrappers'
import React, {useState} from 'react'

interface CheckOutcome {
  readonly name: string
  readonly passed: boolean
  readonly detail?: string
}

type CheckState =
  | {readonly status: 'idle'}
  | {readonly status: 'running'}
  | {readonly status: 'done'; readonly outcomes: readonly CheckOutcome[]}

function expectTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let different = 0
  for (let i = 0; i < a.length; i++) {
    different |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return different === 0
}

const checks: ReadonlyArray<{
  readonly name: string
  readonly run: () => Promise<void> | void
}> = [
  {
    name: 'Migration crypto functions available',
    run: async () => {
      await assertMigrationCryptoSupported()
      expectTrue(
        typeof sodium.crypto_secretstream_xchacha20poly1305_keygen ===
          'function',
        'crypto_secretstream_xchacha20poly1305_keygen missing'
      )
      expectTrue(typeof sodium.memcmp === 'function', 'memcmp missing')
      expectTrue(
        typeof sodium.crypto_auth_keygen === 'function',
        'crypto_auth_keygen missing'
      )
    },
  },
  {
    name: 'Constants',
    run: () => {
      expectTrue(
        sodium.crypto_kx_PUBLICKEYBYTES === 32,
        `crypto_kx_PUBLICKEYBYTES is ${sodium.crypto_kx_PUBLICKEYBYTES}`
      )
      expectTrue(
        sodium.crypto_kx_SECRETKEYBYTES === 32,
        `crypto_kx_SECRETKEYBYTES is ${sodium.crypto_kx_SECRETKEYBYTES}`
      )
      expectTrue(
        sodium.crypto_kx_SESSIONKEYBYTES === 32,
        `crypto_kx_SESSIONKEYBYTES is ${sodium.crypto_kx_SESSIONKEYBYTES}`
      )
      expectTrue(
        sodium.crypto_secretstream_xchacha20poly1305_ABYTES === 17,
        `secretstream ABYTES is ${sodium.crypto_secretstream_xchacha20poly1305_ABYTES}`
      )
      expectTrue(
        sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES === 24,
        `secretstream HEADERBYTES is ${sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES}`
      )
      expectTrue(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES === 32,
        `secretstream KEYBYTES is ${sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES}`
      )
      expectTrue(
        sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE === 0,
        `secretstream TAG_MESSAGE is ${sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE}`
      )
      expectTrue(
        sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL === 3,
        `secretstream TAG_FINAL is ${sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL}`
      )
    },
  },
  {
    name: 'crypto_kx round trip',
    run: () => {
      const client = sodium.crypto_kx_keypair()
      const server = sodium.crypto_kx_keypair()
      expectTrue(
        client.publicKey.length === sodium.crypto_kx_PUBLICKEYBYTES,
        'unexpected public key length'
      )
      const clientKeys = sodium.crypto_kx_client_session_keys(
        client.publicKey,
        client.privateKey,
        server.publicKey
      )
      const serverKeys = sodium.crypto_kx_server_session_keys(
        server.publicKey,
        server.privateKey,
        client.publicKey
      )
      expectTrue(
        bytesEqual(clientKeys.sharedRx, serverKeys.sharedTx),
        'client rx does not match server tx'
      )
      expectTrue(
        bytesEqual(clientKeys.sharedTx, serverKeys.sharedRx),
        'client tx does not match server rx'
      )
      expectTrue(
        !bytesEqual(clientKeys.sharedRx, clientKeys.sharedTx),
        'rx and tx keys are unexpectedly equal'
      )
    },
  },
  {
    name: 'secretstream round trip',
    run: () => {
      const key = sodium.crypto_secretstream_xchacha20poly1305_keygen()
      const {state: pushState, header} =
        sodium.crypto_secretstream_xchacha20poly1305_init_push(key)
      const chunkOne = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        Buffer.from('chunk one', 'utf8'),
        'associated-data',
        sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
      )
      const chunkTwo = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        Buffer.from('chunk two', 'utf8'),
        null,
        sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      )
      const pullState = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        key
      )
      const messageOne = sodium.crypto_secretstream_xchacha20poly1305_pull(
        pullState,
        chunkOne,
        'associated-data'
      )
      expectTrue(messageOne !== false, 'first pull failed')
      if (messageOne === false) return
      expectTrue(
        Buffer.from(messageOne.message).toString('utf8') === 'chunk one',
        'first chunk does not round trip'
      )
      expectTrue(
        messageOne.tag ===
          sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
        `first chunk tag is ${messageOne.tag}`
      )
      const messageTwo = sodium.crypto_secretstream_xchacha20poly1305_pull(
        pullState,
        chunkTwo,
        null
      )
      expectTrue(messageTwo !== false, 'second pull failed')
      if (messageTwo === false) return
      expectTrue(
        Buffer.from(messageTwo.message).toString('utf8') === 'chunk two',
        'second chunk does not round trip'
      )
      expectTrue(
        messageTwo.tag ===
          sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL,
        `second chunk tag is ${messageTwo.tag}`
      )
    },
  },
  {
    name: 'secretstream rejects corruption',
    run: () => {
      const key = sodium.crypto_secretstream_xchacha20poly1305_keygen()
      const {state: pushState, header} =
        sodium.crypto_secretstream_xchacha20poly1305_init_push(key)
      const ciphertext = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        Buffer.from('payload', 'utf8'),
        null,
        sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      )
      const corrupted = Uint8Array.from(ciphertext)
      corrupted[corrupted.length - 1] =
        (corrupted[corrupted.length - 1] ?? 0) ^ 0x01
      const pullState = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        key
      )
      let rejected = false
      try {
        const result = sodium.crypto_secretstream_xchacha20poly1305_pull(
          pullState,
          corrupted,
          null
        )
        rejected = result === false
      } catch {
        rejected = true
      }
      expectTrue(rejected, 'corrupted ciphertext was accepted')
    },
  },
  {
    name: 'secretstream rejects wrong additional data',
    run: () => {
      const key = sodium.crypto_secretstream_xchacha20poly1305_keygen()
      const {state: pushState, header} =
        sodium.crypto_secretstream_xchacha20poly1305_init_push(key)
      const ciphertext = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        Buffer.from('payload', 'utf8'),
        'right-ad',
        sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      )
      const pullState = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        key
      )
      let rejected = false
      try {
        const result = sodium.crypto_secretstream_xchacha20poly1305_pull(
          pullState,
          ciphertext,
          'wrong-ad'
        )
        rejected = result === false
      } catch {
        rejected = true
      }
      expectTrue(rejected, 'wrong additional data was accepted')
    },
  },
  {
    name: 'crypto_auth verify',
    run: () => {
      const key = sodium.crypto_auth_keygen()
      const message = Buffer.from('authenticate me', 'utf8')
      const mac = sodium.crypto_auth(message, key)
      expectTrue(
        sodium.crypto_auth_verify(mac, message, key),
        'valid mac did not verify'
      )
      const tampered = Uint8Array.from(mac)
      tampered[0] = (tampered[0] ?? 0) ^ 0x01
      expectTrue(
        !sodium.crypto_auth_verify(tampered, message, key),
        'tampered mac verified'
      )
      expectTrue(
        !sodium.crypto_auth_verify(
          mac,
          Buffer.from('different message', 'utf8'),
          key
        ),
        'mac verified for different message'
      )
    },
  },
  {
    name: 'crypto_kdf_derive_from_key',
    run: () => {
      const masterKey = sodium.crypto_kdf_keygen()
      const subkeyOne = sodium.crypto_kdf_derive_from_key(
        32,
        1,
        'vexlmigr',
        masterKey
      )
      const subkeyOneAgain = sodium.crypto_kdf_derive_from_key(
        32,
        1,
        'vexlmigr',
        masterKey
      )
      const subkeyTwo = sodium.crypto_kdf_derive_from_key(
        32,
        2,
        'vexlmigr',
        masterKey
      )
      expectTrue(subkeyOne.length === 32, 'unexpected subkey length')
      expectTrue(
        bytesEqual(subkeyOne, subkeyOneAgain),
        'derivation is not deterministic'
      )
      expectTrue(
        !bytesEqual(subkeyOne, subkeyTwo),
        'different subkey ids derived the same key'
      )
    },
  },
  {
    name: 'memcmp',
    run: () => {
      const a = Uint8Array.from([1, 2, 3])
      const b = Uint8Array.from([1, 2, 3])
      const c = Uint8Array.from([1, 2, 4])
      expectTrue(sodium.memcmp(a, b), 'equal buffers compare as different')
      expectTrue(!sodium.memcmp(a, c), 'different buffers compare as equal')
      let threw = false
      try {
        sodium.memcmp(a, Uint8Array.from([1, 2]))
      } catch {
        threw = true
      }
      expectTrue(threw, 'length mismatch did not throw')
    },
  },
]

async function runAllChecks(): Promise<readonly CheckOutcome[]> {
  await sodium.ready
  const outcomes: CheckOutcome[] = []
  for (const check of checks) {
    try {
      await check.run()
      outcomes.push({name: check.name, passed: true})
    } catch (error) {
      outcomes.push({
        name: check.name,
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return outcomes
}

function MigrationCrypto(): React.ReactElement {
  const [state, setState] = useState<CheckState>({status: 'idle'})

  return (
    <YStack gap="$2">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        Migration crypto
      </Typography>
      <Button
        onPress={() => {
          setState({status: 'running'})
          void runAllChecks()
            .then((outcomes) => {
              setState({status: 'done', outcomes})
            })
            .catch((error: unknown) => {
              setState({
                status: 'done',
                outcomes: [
                  {
                    name: 'Run checks',
                    passed: false,
                    detail:
                      error instanceof Error ? error.message : String(error),
                  },
                ],
              })
            })
        }}
        variant="primary"
        size="small"
      >
        Run checks
      </Button>
      {state.status === 'running' && (
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          Running checks...
        </Typography>
      )}
      {state.status === 'done' && (
        <YStack gap="$1">
          {pipe(
            state.outcomes,
            Array.map((outcome) => (
              <Typography
                key={outcome.name}
                variant="paragraphSmall"
                color={outcome.passed ? '$greenForeground' : '$redForeground'}
              >
                {outcome.passed ? 'PASS' : 'FAIL'} {outcome.name}
                {outcome.detail !== undefined ? `: ${outcome.detail}` : ''}
              </Typography>
            ))
          )}
        </YStack>
      )}
    </YStack>
  )
}

export default MigrationCrypto

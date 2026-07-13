import sodium from 'libsodium-wrappers'
import {
  deriveMigrationKeys,
  generateEphemeralKxKeyPair,
  MigrationKeyExchangeError,
  type DeriveMigrationKeysParams,
  type MigrationKxKeyPair,
} from './keyExchange'

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

const TRANSFER_ID = 'test-transfer-id'
const PAIRING_CAPABILITY = 'test-pairing-capability'
const PROTOCOL_VERSION = 1

async function deriveBothSides(
  overrides: {
    destination?: Partial<DeriveMigrationKeysParams>
    source?: Partial<DeriveMigrationKeysParams>
  } = {}
): Promise<{
  source: Awaited<ReturnType<typeof deriveMigrationKeys>>
  destination: Awaited<ReturnType<typeof deriveMigrationKeys>>
  sourceKeyPair: MigrationKxKeyPair
  destinationKeyPair: MigrationKxKeyPair
}> {
  const sourceKeyPair = await generateEphemeralKxKeyPair()
  const destinationKeyPair = await generateEphemeralKxKeyPair()

  const source = await deriveMigrationKeys({
    role: 'source',
    ownKeyPair: sourceKeyPair,
    peerPublicKey: destinationKeyPair.publicKey,
    transferId: TRANSFER_ID,
    pairingCapability: PAIRING_CAPABILITY,
    protocolVersion: PROTOCOL_VERSION,
    ...overrides.source,
  })
  const destination = await deriveMigrationKeys({
    role: 'destination',
    ownKeyPair: destinationKeyPair,
    peerPublicKey: sourceKeyPair.publicKey,
    transferId: TRANSFER_ID,
    pairingCapability: PAIRING_CAPABILITY,
    protocolVersion: PROTOCOL_VERSION,
    ...overrides.destination,
  })

  return {source, destination, sourceKeyPair, destinationKeyPair}
}

describe('generateEphemeralKxKeyPair', () => {
  it('generates 32-byte keys and never repeats', async () => {
    const a = await generateEphemeralKxKeyPair()
    const b = await generateEphemeralKxKeyPair()

    expect(a.publicKey.length).toBe(32)
    expect(a.privateKey.length).toBe(32)
    expect(bytesToHex(a.publicKey)).not.toBe(bytesToHex(b.publicKey))
    expect(bytesToHex(a.privateKey)).not.toBe(bytesToHex(b.privateKey))
  })
})

describe('deriveMigrationKeys', () => {
  it('both roles derive the identical human code and transcript hash', async () => {
    const {source, destination} = await deriveBothSides()

    expect(source.humanAuthCode).toBe(destination.humanAuthCode)
    expect(source.humanAuthCode).toMatch(/^\d{6}$/)
    expect(bytesToHex(source.transcriptHash)).toBe(
      bytesToHex(destination.transcriptHash)
    )
  })

  it('derives mirrored directional keys', async () => {
    const {source, destination} = await deriveBothSides()

    expect(bytesToHex(source.streamTxKey)).toBe(
      bytesToHex(destination.streamRxKey)
    )
    expect(bytesToHex(source.streamRxKey)).toBe(
      bytesToHex(destination.streamTxKey)
    )
    expect(bytesToHex(source.qrMacTxKey)).toBe(
      bytesToHex(destination.qrMacRxKey)
    )
    expect(bytesToHex(source.qrMacRxKey)).toBe(
      bytesToHex(destination.qrMacTxKey)
    )
  })

  it('derives distinct keys for every direction and purpose', async () => {
    const {source} = await deriveBothSides()

    const keys = [
      bytesToHex(source.streamTxKey),
      bytesToHex(source.streamRxKey),
      bytesToHex(source.qrMacTxKey),
      bytesToHex(source.qrMacRxKey),
    ]
    expect(new Set(keys).size).toBe(4)
  })

  it('is deterministic for identical inputs', async () => {
    const sourceKeyPair = await generateEphemeralKxKeyPair()
    const destinationKeyPair = await generateEphemeralKxKeyPair()

    const params: DeriveMigrationKeysParams = {
      role: 'source',
      ownKeyPair: sourceKeyPair,
      peerPublicKey: destinationKeyPair.publicKey,
      transferId: TRANSFER_ID,
      pairingCapability: PAIRING_CAPABILITY,
      protocolVersion: PROTOCOL_VERSION,
    }
    const first = await deriveMigrationKeys(params)
    const second = await deriveMigrationKeys(params)

    expect(bytesToHex(first.streamTxKey)).toBe(bytesToHex(second.streamTxKey))
    expect(bytesToHex(first.streamRxKey)).toBe(bytesToHex(second.streamRxKey))
    expect(bytesToHex(first.qrMacTxKey)).toBe(bytesToHex(second.qrMacTxKey))
    expect(bytesToHex(first.qrMacRxKey)).toBe(bytesToHex(second.qrMacRxKey))
    expect(first.humanAuthCode).toBe(second.humanAuthCode)
    expect(bytesToHex(first.transcriptHash)).toBe(
      bytesToHex(second.transcriptHash)
    )
  })

  it('matches the pinned deterministic test vector', async () => {
    await sodium.ready
    const sourceKeyPair = sodium.crypto_kx_seed_keypair(
      new Uint8Array(32).fill(1)
    )
    const destinationKeyPair = sodium.crypto_kx_seed_keypair(
      new Uint8Array(32).fill(2)
    )

    expect(bytesToHex(sourceKeyPair.publicKey)).toBe(
      'ab2fca32898322c208fb2dab5048bd43c355c6430f588897cb574961cfa9806f'
    )
    expect(bytesToHex(destinationKeyPair.publicKey)).toBe(
      'fc3b339367a5225d53a92d380323afd035d7817b6d1be47d946f6b09a9cbdc06'
    )

    const derived = await deriveMigrationKeys({
      role: 'source',
      ownKeyPair: sourceKeyPair,
      peerPublicKey: destinationKeyPair.publicKey,
      transferId: TRANSFER_ID,
      pairingCapability: PAIRING_CAPABILITY,
      protocolVersion: PROTOCOL_VERSION,
    })

    expect(bytesToHex(derived.transcriptHash)).toBe(
      '2beee527086fc8defe6ebfd4d3d06ca160e4983fd417928a8ce90ab3778c4789'
    )
    expect(derived.humanAuthCode).toBe('602615')
    expect(bytesToHex(derived.streamTxKey)).toBe(
      '9b535aa11de02be52c0f26890db03dc0550344ae6600676a67b4ff584321d901'
    )
    expect(bytesToHex(derived.streamRxKey)).toBe(
      '9eee2a24f8a1c11740e53962e6629ef8eeea06dc1481824befc2a9527e868f78'
    )
    expect(bytesToHex(derived.qrMacTxKey)).toBe(
      'f04298f96ab8a841de441a1bed70bf90597553f8a29db0960d4909bc3bbc34f8'
    )
    expect(bytesToHex(derived.qrMacRxKey)).toBe(
      '458041857766090725bfb5afa7975101986f2878f941c1220fdba76871e6c9ea'
    )
  })

  describe('transcript binding', () => {
    it('a different transferId produces different keys and transcript', async () => {
      const {source, destination} = await deriveBothSides({
        destination: {transferId: 'another-transfer-id'},
      })

      expect(bytesToHex(source.transcriptHash)).not.toBe(
        bytesToHex(destination.transcriptHash)
      )
      expect(bytesToHex(source.streamTxKey)).not.toBe(
        bytesToHex(destination.streamRxKey)
      )
      expect(bytesToHex(source.qrMacTxKey)).not.toBe(
        bytesToHex(destination.qrMacRxKey)
      )
    })

    it('a different pairing capability produces different keys', async () => {
      const {source, destination} = await deriveBothSides({
        destination: {pairingCapability: 'evil-capability'},
      })

      expect(bytesToHex(source.transcriptHash)).not.toBe(
        bytesToHex(destination.transcriptHash)
      )
      expect(bytesToHex(source.streamTxKey)).not.toBe(
        bytesToHex(destination.streamRxKey)
      )
    })

    it('a different protocol version produces different keys', async () => {
      const {source, destination} = await deriveBothSides({
        destination: {protocolVersion: 2},
      })

      expect(bytesToHex(source.transcriptHash)).not.toBe(
        bytesToHex(destination.transcriptHash)
      )
      expect(bytesToHex(source.streamTxKey)).not.toBe(
        bytesToHex(destination.streamRxKey)
      )
    })

    it('a different peer public key produces different keys', async () => {
      const sourceKeyPair = await generateEphemeralKxKeyPair()
      const destinationKeyPair = await generateEphemeralKxKeyPair()
      const attackerKeyPair = await generateEphemeralKxKeyPair()

      const source = await deriveMigrationKeys({
        role: 'source',
        ownKeyPair: sourceKeyPair,
        peerPublicKey: destinationKeyPair.publicKey,
        transferId: TRANSFER_ID,
        pairingCapability: PAIRING_CAPABILITY,
        protocolVersion: PROTOCOL_VERSION,
      })
      const sourceWithAttacker = await deriveMigrationKeys({
        role: 'source',
        ownKeyPair: sourceKeyPair,
        peerPublicKey: attackerKeyPair.publicKey,
        transferId: TRANSFER_ID,
        pairingCapability: PAIRING_CAPABILITY,
        protocolVersion: PROTOCOL_VERSION,
      })

      expect(bytesToHex(source.transcriptHash)).not.toBe(
        bytesToHex(sourceWithAttacker.transcriptHash)
      )
      expect(bytesToHex(source.streamTxKey)).not.toBe(
        bytesToHex(sourceWithAttacker.streamTxKey)
      )
    })

    it('both sides claiming the same role derive non-matching keys', async () => {
      const sourceKeyPair = await generateEphemeralKxKeyPair()
      const destinationKeyPair = await generateEphemeralKxKeyPair()

      const source = await deriveMigrationKeys({
        role: 'source',
        ownKeyPair: sourceKeyPair,
        peerPublicKey: destinationKeyPair.publicKey,
        transferId: TRANSFER_ID,
        pairingCapability: PAIRING_CAPABILITY,
        protocolVersion: PROTOCOL_VERSION,
      })
      const impostor = await deriveMigrationKeys({
        role: 'source',
        ownKeyPair: destinationKeyPair,
        peerPublicKey: sourceKeyPair.publicKey,
        transferId: TRANSFER_ID,
        pairingCapability: PAIRING_CAPABILITY,
        protocolVersion: PROTOCOL_VERSION,
      })

      expect(bytesToHex(source.streamTxKey)).not.toBe(
        bytesToHex(impostor.streamRxKey)
      )
      expect(bytesToHex(source.qrMacTxKey)).not.toBe(
        bytesToHex(impostor.qrMacRxKey)
      )
    })
  })

  describe('input validation', () => {
    it('rejects a peer public key of wrong length', async () => {
      const keyPair = await generateEphemeralKxKeyPair()

      await expect(
        deriveMigrationKeys({
          role: 'source',
          ownKeyPair: keyPair,
          peerPublicKey: new Uint8Array(31),
          transferId: TRANSFER_ID,
          pairingCapability: PAIRING_CAPABILITY,
          protocolVersion: PROTOCOL_VERSION,
        })
      ).rejects.toThrow(MigrationKeyExchangeError)
    })

    it('rejects an own key pair of wrong length', async () => {
      const keyPair = await generateEphemeralKxKeyPair()

      await expect(
        deriveMigrationKeys({
          role: 'source',
          ownKeyPair: {
            publicKey: keyPair.publicKey,
            privateKey: new Uint8Array(16),
          },
          peerPublicKey: keyPair.publicKey,
          transferId: TRANSFER_ID,
          pairingCapability: PAIRING_CAPABILITY,
          protocolVersion: PROTOCOL_VERSION,
        })
      ).rejects.toThrow(MigrationKeyExchangeError)
    })

    it('rejects an invalid protocol version', async () => {
      const {sourceKeyPair, destinationKeyPair} = await deriveBothSides()

      for (const protocolVersion of [-1, 1.5, Number.NaN, 2 ** 32]) {
        await expect(
          deriveMigrationKeys({
            role: 'source',
            ownKeyPair: sourceKeyPair,
            peerPublicKey: destinationKeyPair.publicKey,
            transferId: TRANSFER_ID,
            pairingCapability: PAIRING_CAPABILITY,
            protocolVersion,
          })
        ).rejects.toThrow(MigrationKeyExchangeError)
      }
    })

    it('rejects empty transferId and pairingCapability', async () => {
      const {sourceKeyPair, destinationKeyPair} = await deriveBothSides()

      await expect(
        deriveMigrationKeys({
          role: 'source',
          ownKeyPair: sourceKeyPair,
          peerPublicKey: destinationKeyPair.publicKey,
          transferId: '',
          pairingCapability: PAIRING_CAPABILITY,
          protocolVersion: PROTOCOL_VERSION,
        })
      ).rejects.toThrow(MigrationKeyExchangeError)

      await expect(
        deriveMigrationKeys({
          role: 'source',
          ownKeyPair: sourceKeyPair,
          peerPublicKey: destinationKeyPair.publicKey,
          transferId: TRANSFER_ID,
          pairingCapability: '',
          protocolVersion: PROTOCOL_VERSION,
        })
      ).rejects.toThrow(MigrationKeyExchangeError)
    })
  })
})

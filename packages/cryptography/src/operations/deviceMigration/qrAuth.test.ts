import {
  deriveMigrationKeys,
  generateEphemeralKxKeyPair,
  type MigrationKeys,
} from './keyExchange'
import {createQrMac, QR_MAC_BYTES, QrMacError, verifyQrMac} from './qrAuth'

function utf8(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'utf-8'))
}

async function deriveBothSides(): Promise<{
  source: MigrationKeys
  destination: MigrationKeys
}> {
  const sourceKeyPair = await generateEphemeralKxKeyPair()
  const destinationKeyPair = await generateEphemeralKxKeyPair()

  const shared = {
    transferId: 'transfer-id',
    pairingCapability: 'pairing-capability',
    protocolVersion: 1,
  }
  const source = await deriveMigrationKeys({
    role: 'source',
    ownKeyPair: sourceKeyPair,
    peerPublicKey: destinationKeyPair.publicKey,
    ...shared,
  })
  const destination = await deriveMigrationKeys({
    role: 'destination',
    ownKeyPair: destinationKeyPair,
    peerPublicKey: sourceKeyPair.publicKey,
    ...shared,
  })
  return {source, destination}
}

describe('qrAuth', () => {
  it('a destination-created MAC verifies on the source (erase-command direction)', async () => {
    const {source, destination} = await deriveBothSides()
    const payload = utf8('erase-command-payload')

    const mac = await createQrMac(
      payload,
      destination.qrMacTxKey,
      'destination'
    )

    expect(mac.length).toBe(QR_MAC_BYTES)
    expect(
      await verifyQrMac(mac, payload, source.qrMacRxKey, 'destination')
    ).toBe(true)
  })

  it('a source-created MAC verifies on the destination (receipt direction)', async () => {
    const {source, destination} = await deriveBothSides()
    const payload = utf8('source-erased-receipt-payload')

    const mac = await createQrMac(payload, source.qrMacTxKey, 'source')

    expect(
      await verifyQrMac(mac, payload, destination.qrMacRxKey, 'source')
    ).toBe(true)
  })

  it('fails on a tampered payload', async () => {
    const {source, destination} = await deriveBothSides()
    const payload = utf8('authentic payload')

    const mac = await createQrMac(payload, source.qrMacTxKey, 'source')

    expect(
      await verifyQrMac(
        mac,
        utf8('authentic payloae'),
        destination.qrMacRxKey,
        'source'
      )
    ).toBe(false)
  })

  it('fails on a tampered MAC', async () => {
    const {source, destination} = await deriveBothSides()
    const payload = utf8('authentic payload')

    const mac = await createQrMac(payload, source.qrMacTxKey, 'source')
    const tampered = new Uint8Array(mac)
    const byte = tampered[0]
    if (byte === undefined) throw new Error('unexpected empty mac')
    tampered[0] = byte ^ 0x01

    expect(
      await verifyQrMac(tampered, payload, destination.qrMacRxKey, 'source')
    ).toBe(false)
  })

  it('fails when verified against the swapped-direction key', async () => {
    const {source, destination} = await deriveBothSides()
    const payload = utf8('payload')

    const mac = await createQrMac(payload, source.qrMacTxKey, 'source')

    // destination.qrMacTxKey is the destination→source key — a MAC created
    // for the source→destination direction must never verify against it.
    expect(
      await verifyQrMac(mac, payload, destination.qrMacTxKey, 'source')
    ).toBe(false)
  })

  it('fails when the claimed sender role is swapped', async () => {
    const {source, destination} = await deriveBothSides()
    const payload = utf8('payload')

    const mac = await createQrMac(payload, source.qrMacTxKey, 'source')

    expect(
      await verifyQrMac(mac, payload, destination.qrMacRxKey, 'destination')
    ).toBe(false)
  })

  it('fails with a completely unrelated key', async () => {
    const {source} = await deriveBothSides()
    const {destination: otherDestination} = await deriveBothSides()
    const payload = utf8('payload')

    const mac = await createQrMac(payload, source.qrMacTxKey, 'source')

    expect(
      await verifyQrMac(mac, payload, otherDestination.qrMacRxKey, 'source')
    ).toBe(false)
  })

  it('returns false for a MAC of wrong length instead of throwing', async () => {
    const {source} = await deriveBothSides()

    expect(
      await verifyQrMac(
        new Uint8Array(QR_MAC_BYTES - 1),
        utf8('payload'),
        source.qrMacRxKey,
        'destination'
      )
    ).toBe(false)
    expect(
      await verifyQrMac(
        new Uint8Array(0),
        utf8('payload'),
        source.qrMacRxKey,
        'destination'
      )
    ).toBe(false)
  })

  it('throws on a key of invalid length', async () => {
    await expect(
      createQrMac(utf8('payload'), new Uint8Array(16), 'source')
    ).rejects.toThrow(QrMacError)
    await expect(
      verifyQrMac(
        new Uint8Array(QR_MAC_BYTES),
        utf8('payload'),
        new Uint8Array(16),
        'source'
      )
    ).rejects.toThrow(QrMacError)
  })

  it('is deterministic for identical inputs', async () => {
    const {source} = await deriveBothSides()
    const payload = utf8('payload')

    const mac1 = await createQrMac(payload, source.qrMacTxKey, 'source')
    const mac2 = await createQrMac(payload, source.qrMacTxKey, 'source')

    expect(Buffer.from(mac1).equals(Buffer.from(mac2))).toBe(true)
  })
})

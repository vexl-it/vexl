import {Either, Option, Schema} from 'effect'
import {Base64} from 'js-base64'
import {
  UnixMilliseconds,
  unixMillisecondsFromNow,
} from '../../utility/UnixMilliseconds.brand'
import {QrAuthMac, SnapshotContentDigest} from './brands'
import {bytesToHex} from './encoding'
import {MAX_QR_PAYLOAD_BYTES, QR_CODE_EXPIRY_MS} from './limits'
import {
  EraseCommandQrCode,
  eraseCommandQrCodeMacPayloadBytes,
  isQrCodeExpired,
  PairingQrCode,
  sourceCancellationConfirmedMacPayloadBytes,
  SourceCancellationConfirmedQrCode,
  sourceErasedReceiptMacPayloadBytes,
  SourceErasedReceiptQrCode,
  validateQrCodeNotExpired,
} from './qrCodes'
import {
  hex64,
  testCleanupResultDigest,
  testCommandNonce,
  testEraseCommandDigest,
  testKeyExchangePublicKey,
  testManifestDigest,
  testPairingCapability,
  testQrAuthMac,
  testReceiptNonce,
  testSnapshotContentDigest,
  testStagingReceiptDigest,
  testTransferId,
  testVersionTriple,
} from './testFixtures'

const issuedAt = Schema.decodeSync(UnixMilliseconds)(1751000000000)
const expiresAt = Schema.decodeSync(UnixMilliseconds)(
  1751000000000 + QR_CODE_EXPIRY_MS
)

const makePairingQrCodeWithHost = (host: string): PairingQrCode =>
  new PairingQrCode({
    qrSchemaVersion: 1,
    version: testVersionTriple,
    transferId: testTransferId,
    issuedAt,
    expiresAt,
    endpointCandidates: [{host, port: 42_042}],
    sourceKeyExchangePublicKey: testKeyExchangePublicKey,
    pairingCapability: testPairingCapability,
  })

const makePairingQrCode = (): PairingQrCode =>
  makePairingQrCodeWithHost('192.168.1.10')

const makeEraseCommandQrCode = (): EraseCommandQrCode =>
  new EraseCommandQrCode({
    qrSchemaVersion: 1,
    version: testVersionTriple,
    transferId: testTransferId,
    manifestDigest: testManifestDigest,
    snapshotContentDigest: testSnapshotContentDigest,
    commandNonce: testCommandNonce,
    issuedAt,
    expiresAt,
    stagingReceiptDigest: testStagingReceiptDigest,
    mac: testQrAuthMac,
  })

const makeSourceErasedReceiptQrCode = (): SourceErasedReceiptQrCode =>
  new SourceErasedReceiptQrCode({
    qrSchemaVersion: 1,
    version: testVersionTriple,
    transferId: testTransferId,
    manifestDigest: testManifestDigest,
    snapshotContentDigest: testSnapshotContentDigest,
    acceptedEraseCommandDigest: testEraseCommandDigest,
    acceptedEraseCommandNonce: testCommandNonce,
    receiptNonce: testReceiptNonce,
    cleanupResultDigest: testCleanupResultDigest,
    issuedAt,
    mac: testQrAuthMac,
  })

const makeSourceCancellationConfirmedQrCode =
  (): SourceCancellationConfirmedQrCode =>
    new SourceCancellationConfirmedQrCode({
      qrSchemaVersion: 1,
      version: testVersionTriple,
      transferId: testTransferId,
      manifestDigest: testManifestDigest,
      snapshotContentDigest: testSnapshotContentDigest,
      cancellationNonce: testReceiptNonce,
      issuedAt,
      mac: testQrAuthMac,
    })

describe('QR string round trips', () => {
  it('pairing QR encodes to url-safe base64 within the limit and decodes back', () => {
    const qrCode = makePairingQrCode()
    const encoded = qrCode.encodeToQrString()
    expect(Either.isRight(encoded)).toBe(true)
    if (Either.isRight(encoded)) {
      expect(encoded.right.length).toBeLessThanOrEqual(MAX_QR_PAYLOAD_BYTES)
      expect(/^[A-Za-z0-9_-]+$/.test(encoded.right)).toBe(true)
      const decoded = PairingQrCode.decodeFromQrString(encoded.right)
      expect(Either.isRight(decoded)).toBe(true)
      if (Either.isRight(decoded)) {
        expect(decoded.right.toData()).toEqual(qrCode.toData())
      }
    }
  })

  it('erase command, cancellation and receipt QRs round trip', () => {
    const expectRoundTrip = <
      T extends {
        toData: () => unknown
        encodeToQrString: () => Either.Either<string, unknown>
      },
    >(
      original: T,
      decode: (qrString: string) => Either.Either<T, unknown>
    ): void => {
      const encoded = original.encodeToQrString()
      expect(Either.isRight(encoded)).toBe(true)
      if (Either.isRight(encoded)) {
        const decoded = decode(encoded.right)
        expect(Either.isRight(decoded)).toBe(true)
        if (Either.isRight(decoded)) {
          expect(decoded.right.toData()).toEqual(original.toData())
        }
      }
    }

    expectRoundTrip(
      makeEraseCommandQrCode(),
      EraseCommandQrCode.decodeFromQrString
    )
    expectRoundTrip(
      makeSourceCancellationConfirmedQrCode(),
      SourceCancellationConfirmedQrCode.decodeFromQrString
    )
    expectRoundTrip(
      makeSourceErasedReceiptQrCode(),
      SourceErasedReceiptQrCode.decodeFromQrString
    )
  })
})

describe('QR decoding rejects malformed input', () => {
  it('rejects garbage, wrong payloads and cross-type payloads', () => {
    expect(Either.isLeft(PairingQrCode.decodeFromQrString(''))).toBe(true)
    expect(
      Either.isLeft(PairingQrCode.decodeFromQrString('not base64url!!!'))
    ).toBe(true)
    expect(
      Either.isLeft(
        PairingQrCode.decodeFromQrString(Base64.encodeURI('not json'))
      )
    ).toBe(true)
    expect(
      Either.isLeft(
        PairingQrCode.decodeFromQrString(Base64.encodeURI('{"a":1}'))
      )
    ).toBe(true)

    // a valid erase command is not a valid pairing QR (unknown _tag)
    const eraseCommand = makeEraseCommandQrCode().encodeToQrString()
    expect(Either.isRight(eraseCommand)).toBe(true)
    if (Either.isRight(eraseCommand)) {
      expect(
        Either.isLeft(PairingQrCode.decodeFromQrString(eraseCommand.right))
      ).toBe(true)
    }
  })

  it('parseUnkownOption fails closed on unknown tags and missing fields', () => {
    expect(
      Option.isNone(
        PairingQrCode.parseUnkownOption({
          ...makePairingQrCode().toData(),
          _tag: 'SomethingElse',
        })
      )
    ).toBe(true)
    expect(Option.isNone(EraseCommandQrCode.parseUnkownOption({}))).toBe(true)
    expect(
      Option.isNone(
        EraseCommandQrCode.parseUnkownOption({
          ...makeEraseCommandQrCode().toData(),
          mac: 'short',
        })
      )
    ).toBe(true)
  })

  it('rejects oversize QR strings before decoding', () => {
    const oversize = 'A'.repeat(MAX_QR_PAYLOAD_BYTES + 1)
    const result = PairingQrCode.decodeFromQrString(oversize)
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left.code).toBe('limitExceeded')
    }
  })
})

describe('QR payload size limit', () => {
  it('enforces the 2 KiB limit immediately below, at and above the boundary', () => {
    // Grow one endpoint host until the encoded payload hits exactly the
    // limit; base64url of n json bytes is 4*ceil(n/3) ascii bytes.
    const jsonLengthOf = (hostLength: number): number =>
      JSON.stringify(makePairingQrCodeWithHost('h'.repeat(hostLength)).toData())
        .length
    const encodedLengthOfJson = (jsonLength: number): number =>
      4 * Math.ceil(jsonLength / 3)

    // Find the host length whose encoded payload is exactly MAX_QR_PAYLOAD_BYTES
    let hostLength = 1
    while (
      encodedLengthOfJson(jsonLengthOf(hostLength + 1)) <= MAX_QR_PAYLOAD_BYTES
    ) {
      hostLength++
    }

    const qrCodeOf = (length: number): PairingQrCode =>
      makePairingQrCodeWithHost('h'.repeat(length))

    const atLimit = qrCodeOf(hostLength).encodeToQrString()
    expect(Either.isRight(atLimit)).toBe(true)
    if (Either.isRight(atLimit)) {
      expect(atLimit.right.length).toBeLessThanOrEqual(MAX_QR_PAYLOAD_BYTES)
    }

    const belowLimit = qrCodeOf(hostLength - 1).encodeToQrString()
    expect(Either.isRight(belowLimit)).toBe(true)

    const aboveLimit = qrCodeOf(hostLength + 1).encodeToQrString()
    expect(Either.isLeft(aboveLimit)).toBe(true)
    if (Either.isLeft(aboveLimit)) {
      expect(aboveLimit.left.code).toBe('limitExceeded')
    }
  })
})

describe('QR expiry', () => {
  it('rejects expired pairing and erase-command QRs', () => {
    const qrCode = makePairingQrCode()
    const beforeExpiry = Schema.decodeSync(UnixMilliseconds)(
      qrCode.expiresAt - 1
    )
    const atExpiry = qrCode.expiresAt
    const afterExpiry = Schema.decodeSync(UnixMilliseconds)(
      qrCode.expiresAt + 1
    )

    expect(isQrCodeExpired(qrCode, beforeExpiry)).toBe(false)
    expect(isQrCodeExpired(qrCode, atExpiry)).toBe(false)
    expect(isQrCodeExpired(qrCode, afterExpiry)).toBe(true)

    expect(Either.isRight(validateQrCodeNotExpired(qrCode, beforeExpiry))).toBe(
      true
    )
    const expired = validateQrCodeNotExpired(qrCode, afterExpiry)
    expect(Either.isLeft(expired)).toBe(true)
    if (Either.isLeft(expired)) {
      expect(expired.left.code).toBe('qrExpired')
    }

    const expiredCommand = validateQrCodeNotExpired(
      makeEraseCommandQrCode(),
      afterExpiry
    )
    expect(Either.isLeft(expiredCommand)).toBe(true)
  })

  it('unixMillisecondsFromNow produces a QR expiry in the future', () => {
    const expiry = unixMillisecondsFromNow(QR_CODE_EXPIRY_MS)
    expect(expiry).toBeGreaterThan(Date.now())
  })
})

describe('MAC payload bytes', () => {
  it('is deterministic and excludes the mac field', () => {
    const command = makeEraseCommandQrCode()
    const differentMac = Schema.decodeSync(QrAuthMac)(
      Base64.fromUint8Array(new Uint8Array(32).fill(9))
    )
    expect(bytesToHex(command.macPayloadBytes())).toBe(
      bytesToHex(eraseCommandQrCodeMacPayloadBytes(command))
    )
    // the mac field itself never participates in the payload
    expect(bytesToHex(command.macPayloadBytes())).not.toContain(
      bytesToHex(new Uint8Array(32).fill(9))
    )
    const decodedWithDifferentMac = Schema.decodeUnknownSync(
      EraseCommandQrCode
    )({...command.toData(), mac: differentMac})
    expect(bytesToHex(decodedWithDifferentMac.macPayloadBytes())).toBe(
      bytesToHex(command.macPayloadBytes())
    )
  })

  it('changes when any authenticated field changes', () => {
    const command = makeEraseCommandQrCode()
    const base = bytesToHex(eraseCommandQrCodeMacPayloadBytes(command))
    expect(
      bytesToHex(
        eraseCommandQrCodeMacPayloadBytes({
          ...command,
          snapshotContentDigest: Schema.decodeSync(SnapshotContentDigest)(
            hex64('9')
          ),
        })
      )
    ).not.toBe(base)
    expect(
      bytesToHex(
        eraseCommandQrCodeMacPayloadBytes({
          ...command,
          expiresAt: Schema.decodeSync(UnixMilliseconds)(command.expiresAt + 1),
        })
      )
    ).not.toBe(base)
  })

  it('uses distinct domain separation per QR record type', () => {
    const cancellation = makeSourceCancellationConfirmedQrCode()
    const receipt = makeSourceErasedReceiptQrCode()
    expect(
      bytesToHex(sourceCancellationConfirmedMacPayloadBytes(cancellation))
    ).not.toBe(bytesToHex(sourceErasedReceiptMacPayloadBytes(receipt)))
    expect(bytesToHex(cancellation.macPayloadBytes())).toBe(
      bytesToHex(sourceCancellationConfirmedMacPayloadBytes(cancellation))
    )
    expect(bytesToHex(receipt.macPayloadBytes())).toBe(
      bytesToHex(sourceErasedReceiptMacPayloadBytes(receipt))
    )
  })
})

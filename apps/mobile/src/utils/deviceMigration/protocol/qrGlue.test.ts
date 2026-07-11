import {createQrMac} from '@vexl-next/cryptography/src/operations/deviceMigration/qrAuth'
import {generateRandomBytes} from '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes'
import {
  ManifestDigest,
  SnapshotContentDigest,
  StagingReceiptDigest,
  TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  EraseCommandQrCode,
  eraseCommandQrCodeMacPayloadBytes,
} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {Effect, Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {
  createEraseCommandQr,
  currentMigrationVersion,
  validateEraseCommandOnSource,
} from './qrGlue'

const transferId = Schema.decodeSync(TransferId)('A'.repeat(43))
const otherTransferId = Schema.decodeSync(TransferId)('B'.repeat(43))
const manifestDigest = Schema.decodeSync(ManifestDigest)('1'.repeat(64))
const contentDigest = Schema.decodeSync(SnapshotContentDigest)('2'.repeat(64))
const stagingDigest = Schema.decodeSync(StagingReceiptDigest)('3'.repeat(64))
const bindings = {
  version: currentMigrationVersion,
  transferId,
  manifestDigest,
  snapshotContentDigest: contentDigest,
  stagingReceiptDigest: stagingDigest,
}

describe('erase-command QR glue', () => {
  it('validates exact bindings and rejects replay, expiry and substitution', async () => {
    const key = await generateRandomBytes(32)
    const created = await Effect.runPromise(
      createEraseCommandQr({...bindings, qrMacTxKey: key, now: () => 1000})
    )
    const usedNonces = new Set<string>()
    await Effect.runPromise(
      validateEraseCommandOnSource({
        qrString: created.qrString,
        expected: bindings,
        qrMacRxKey: key,
        usedNonces,
        now: () => 1001,
      })
    )
    const replay = await Effect.runPromise(
      validateEraseCommandOnSource({
        qrString: created.qrString,
        expected: bindings,
        qrMacRxKey: key,
        usedNonces,
        now: () => 1001,
      }).pipe(Effect.either)
    )
    expect(Either.isLeft(replay) && replay.left.code).toBe('nonceReused')
    const substituted = await Effect.runPromise(
      validateEraseCommandOnSource({
        qrString: created.qrString,
        expected: {...bindings, transferId: otherTransferId},
        qrMacRxKey: key,
        usedNonces: new Set(),
        now: () => 1001,
      }).pipe(Effect.either)
    )
    expect(Either.isLeft(substituted) && substituted.left.code).toBe(
      'digestMismatch'
    )
    const expired = await Effect.runPromise(
      validateEraseCommandOnSource({
        qrString: created.qrString,
        expected: bindings,
        qrMacRxKey: key,
        usedNonces: new Set(),
        now: () => created.qrCode.expiresAt + 1,
      }).pipe(Effect.either)
    )
    expect(Either.isLeft(expired) && expired.left.code).toBe('qrExpired')
  })

  it('rejects a role-swapped MAC', async () => {
    const key = await generateRandomBytes(32)
    const created = await Effect.runPromise(
      createEraseCommandQr({...bindings, qrMacTxKey: key})
    )
    const roleSwappedMac = await createQrMac(
      eraseCommandQrCodeMacPayloadBytes(created.qrCode),
      key,
      'source'
    )
    const swapped = new EraseCommandQrCode({
      qrSchemaVersion: created.qrCode.qrSchemaVersion,
      version: created.qrCode.version,
      transferId: created.qrCode.transferId,
      manifestDigest: created.qrCode.manifestDigest,
      snapshotContentDigest: created.qrCode.snapshotContentDigest,
      commandNonce: created.qrCode.commandNonce,
      issuedAt: created.qrCode.issuedAt,
      expiresAt: created.qrCode.expiresAt,
      stagingReceiptDigest: created.qrCode.stagingReceiptDigest,
      mac: Schema.decodeSync(
        Schema.String.pipe(
          Schema.filter((value) => Base64.toUint8Array(value).length === 32),
          Schema.brand('QrAuthMac')
        )
      )(Base64.fromUint8Array(roleSwappedMac)),
    })
    const encoded = swapped.encodeToQrString()
    expect(Either.isRight(encoded)).toBe(true)
    if (Either.isLeft(encoded)) return
    const result = await Effect.runPromise(
      validateEraseCommandOnSource({
        qrString: encoded.right,
        expected: bindings,
        qrMacRxKey: key,
        usedNonces: new Set(),
      }).pipe(Effect.either)
    )
    expect(Either.isLeft(result) && result.left.code).toBe('macInvalid')
  })
})

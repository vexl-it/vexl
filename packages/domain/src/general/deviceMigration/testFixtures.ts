import {Schema} from 'effect'
import {Base64} from 'js-base64'
import {
  CleanupResultDigest,
  CommandNonce,
  EraseCommandDigest,
  ManifestDigest,
  MigrationKeyExchangePublicKey,
  PairingCapability,
  QrAuthMac,
  ReceiptNonce,
  Sha256Hex,
  SnapshotContentDigest,
  StagingReceiptDigest,
  TransferId,
} from './brands'
import {MmkvEntryKey, NormalizedRelativeFilePath} from './snapshotEntries'
import {
  type CanonicalManifestForDigest,
  SnapshotManifest,
  toCanonicalManifestForDigest,
} from './snapshotManifest'
import {VersionTriple} from './version'

export const base64UrlOf32Bytes = (fillChar: string): string =>
  fillChar.repeat(43)

export const hex64 = (lastChar: string): string =>
  `${'0'.repeat(63)}${lastChar}`

export const base64Of32Bytes = (fillByte: number): string =>
  Base64.fromUint8Array(new Uint8Array(32).fill(fillByte))

export const testTransferId = Schema.decodeSync(TransferId)(
  base64UrlOf32Bytes('T')
)
export const testPairingCapability = Schema.decodeSync(PairingCapability)(
  base64UrlOf32Bytes('P')
)
export const testCommandNonce = Schema.decodeSync(CommandNonce)(
  base64UrlOf32Bytes('C')
)
export const testReceiptNonce = Schema.decodeSync(ReceiptNonce)(
  base64UrlOf32Bytes('R')
)
export const testManifestDigest = Schema.decodeSync(ManifestDigest)(hex64('1'))
export const testSnapshotContentDigest = Schema.decodeSync(
  SnapshotContentDigest
)(hex64('2'))
export const testStagingReceiptDigest = Schema.decodeSync(StagingReceiptDigest)(
  hex64('3')
)
export const testEraseCommandDigest = Schema.decodeSync(EraseCommandDigest)(
  hex64('4')
)
export const testCleanupResultDigest = Schema.decodeSync(CleanupResultDigest)(
  hex64('5')
)
export const testSha256 = Schema.decodeSync(Sha256Hex)(hex64('6'))
export const testKeyExchangePublicKey = Schema.decodeSync(
  MigrationKeyExchangePublicKey
)(base64Of32Bytes(7))
export const testQrAuthMac = Schema.decodeSync(QrAuthMac)(base64Of32Bytes(8))

export const testVersionTriple = Schema.decodeSync(VersionTriple)({
  appVersion: '1.44.2',
  migrationProtocolVersion: 1,
  snapshotStorageSchemaVersion: 1,
})

export const mmkvKey = (key: string): MmkvEntryKey =>
  Schema.decodeSync(MmkvEntryKey)(key)

export const filePath = (path: string): NormalizedRelativeFilePath =>
  Schema.decodeSync(NormalizedRelativeFilePath)(path)

export interface TestManifestOverrides {
  readonly mmkvEntries?: SnapshotManifest['mmkvEntries']
  readonly files?: SnapshotManifest['files']
  readonly session?: SnapshotManifest['session']
  readonly mmkvEntryCount?: number
  readonly fileCount?: number
  readonly totalByteLength?: number
  readonly manifestDigest?: ManifestDigest
  readonly snapshotContentDigest?: SnapshotContentDigest
}

export const makeTestManifestInput = (
  overrides: TestManifestOverrides = {}
): unknown => {
  const mmkvEntries = overrides.mmkvEntries ?? [
    {key: 'messagingState', type: 'string', byteLength: 10, sha256: hex64('a')},
    {key: 'logs_enabled', type: 'boolean', byteLength: 1, sha256: hex64('b')},
  ]
  const files = overrides.files ?? [
    {
      path: 'chat-images/abc/def.jpg',
      byteLength: 100,
      sha256: hex64('c'),
    },
  ]
  const session = overrides.session ?? {byteLength: 50, sha256: hex64('d')}
  const totalByteLength =
    overrides.totalByteLength ??
    mmkvEntries.reduce((sum, entry) => sum + entry.byteLength, 0) +
      session.byteLength +
      files.reduce((sum, file) => sum + file.byteLength, 0)

  return {
    snapshotSchemaVersion: 1,
    appVersion: '1.44.2',
    storageSchemaVersion: 1,
    protocolVersion: 1,
    createdAt: 1751000000000,
    mmkvEntries,
    session,
    files,
    mmkvEntryCount: overrides.mmkvEntryCount ?? mmkvEntries.length,
    fileCount: overrides.fileCount ?? files.length,
    totalByteLength,
    manifestDigest: overrides.manifestDigest ?? hex64('1'),
    snapshotContentDigest: overrides.snapshotContentDigest ?? hex64('2'),
  }
}

export const makeTestManifest = (
  overrides: TestManifestOverrides = {}
): SnapshotManifest =>
  Schema.decodeUnknownSync(SnapshotManifest)(makeTestManifestInput(overrides))

export const makeTestCanonicalManifest = (
  overrides: TestManifestOverrides = {}
): CanonicalManifestForDigest =>
  toCanonicalManifestForDigest(makeTestManifest(overrides))

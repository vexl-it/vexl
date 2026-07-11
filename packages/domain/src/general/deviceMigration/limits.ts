/**
 * Transport and snapshot limits from the device migration specification
 * (docs/device-migration-spec.md, section "Transport limits").
 *
 * These values are deliberately conservative. Raising any of them requires a
 * separate memory/disk/DoS review. The measured values and sizes are local
 * migration metadata and must never be reported to Vexl, Sentry, analytics,
 * logs, or metrics.
 */

const KIB = 1024
const MIB = 1024 * KIB
const GIB = 1024 * MIB
const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS

/** Any QR payload after encoding: 2 KiB. */
export const MAX_QR_PAYLOAD_BYTES = 2 * KIB

/** One handshake message: 64 KiB. */
export const MAX_HANDSHAKE_MESSAGE_BYTES = 64 * KIB

/** One control frame plaintext: 64 KiB. */
export const MAX_CONTROL_FRAME_PLAINTEXT_BYTES = 64 * KIB

/** One data chunk plaintext: 64 KiB. */
export const MAX_DATA_CHUNK_PLAINTEXT_BYTES = 64 * KIB

/** One MMKV key: 256 UTF-8 bytes. */
export const MAX_MMKV_KEY_UTF8_BYTES = 256

/** Total number of MMKV entries in one snapshot: 4,096. */
export const MAX_MMKV_ENTRY_COUNT = 4096

/** One MMKV value: 64 MiB. */
export const MAX_MMKV_VALUE_BYTES = 64 * MIB

/** One normalized relative file path: 512 UTF-8 bytes. */
export const MAX_FILE_RELATIVE_PATH_UTF8_BYTES = 512

/** Total number of files in one snapshot: 4,096. */
export const MAX_FILE_COUNT = 4096

/** One file: 25 MiB. */
export const MAX_FILE_BYTES = 25 * MIB

/** Total uncompressed snapshot: 1 GiB. */
export const MAX_TOTAL_SNAPSHOT_BYTES = 1 * GIB

/** Handshake inactivity timeout: 15 seconds. */
export const HANDSHAKE_INACTIVITY_TIMEOUT_MS = 15 * SECOND_MS

/** Stream inactivity timeout: 30 seconds. */
export const STREAM_INACTIVITY_TIMEOUT_MS = 30 * SECOND_MS

/** Time to initiate a connection after scanning the pairing QR: 5 minutes. */
export const TIME_TO_INITIATE_AFTER_SCAN_MS = 5 * MINUTE_MS

/** Maximum connected migration duration: 15 minutes. */
export const MAX_CONNECTED_MIGRATION_DURATION_MS = 15 * MINUTE_MS

/**
 * Expiry of the pairing QR and the erase-command QR: 5 minutes after
 * creation. The source-erased receipt QR deliberately has no expiry.
 */
export const QR_CODE_EXPIRY_MS = 5 * MINUTE_MS

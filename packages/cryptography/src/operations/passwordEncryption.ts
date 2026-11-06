import {Schema} from 'effect'
import {CYPHER_ALGORITHM} from '../constants'
import {getCrypto} from '../getCrypto'
import pbkdf2 from './pbkdf2Promise'

const PBKDF2_ITERATIONS = 600_000
const PBKDF2_DIGEST = 'sha256'
const KEY_LENGTH = 32
const SALT_LENGTH = 16
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const HEADER_LENGTH = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH

export class InvalidPasswordCypherError extends Schema.TaggedError<InvalidPasswordCypherError>(
  'InvalidPasswordCypherError'
)('InvalidPasswordCypherError', {}) {}

export class WrongPasswordError extends Schema.TaggedError<WrongPasswordError>(
  'WrongPasswordError'
)('WrongPasswordError', {}) {}

const deriveKey = async (password: string, salt: Buffer): Promise<Buffer> =>
  await pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST)

/**
 * AES-256-GCM with a key stretched from the password by PBKDF2 and a random
 * per-message salt. Output: base64(salt | iv | authTag | ciphertext).
 */
export async function encryptWithPassword({
  data,
  password,
}: {
  data: string
  password: string
}): Promise<string> {
  const crypto = getCrypto()
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(
    CYPHER_ALGORITHM,
    await deriveKey(password, salt),
    iv
  )
  // react-native-quick-crypto returns ArrayBuffers, Buffer.from normalizes them
  const encrypted = Buffer.concat([
    Buffer.from(cipher.update(data, 'utf8')),
    Buffer.from(cipher.final()),
  ])

  return Buffer.concat([salt, iv, cipher.getAuthTag(), encrypted]).toString(
    'base64'
  )
}

/**
 * @throws InvalidPasswordCypherError if the cypher is not produced by encryptWithPassword
 * @throws WrongPasswordError if the password (or the cypher) does not authenticate
 */
export async function decryptWithPassword({
  data,
  password,
}: {
  data: string
  password: string
}): Promise<string> {
  const bytes = Buffer.from(data, 'base64')
  if (bytes.length < HEADER_LENGTH) throw new InvalidPasswordCypherError()

  const salt = bytes.subarray(0, SALT_LENGTH)
  const iv = bytes.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = bytes.subarray(SALT_LENGTH + IV_LENGTH, HEADER_LENGTH)

  const decipher = getCrypto().createDecipheriv(
    CYPHER_ALGORITHM,
    await deriveKey(password, salt),
    iv
  )
  decipher.setAuthTag(authTag)

  try {
    return Buffer.concat([
      Buffer.from(decipher.update(bytes.subarray(HEADER_LENGTH))),
      Buffer.from(decipher.final()),
    ]).toString('utf8')
  } catch {
    throw new WrongPasswordError()
  }
}

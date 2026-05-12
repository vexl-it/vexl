import {CYPHER_ALGORITHM, PBKDF2ITER, SALT} from '../constants'
import {getCrypto} from '../getCrypto'
import {removeEmptyBytesAtTheEnd} from '../utils'
import {appendVersion, parseStringWithVersion} from '../versionWrapper'
import pbkdf2 from './pbkdf2Promise'

export function aesGCMEncrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const crypto = getCrypto()
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32,
    'sha1'
  )

  const iv = crypto.randomBytes(12)

  const cipher = crypto.createCipheriv(CYPHER_ALGORITHM, stretchedPass, iv)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return appendVersion(
    `${iv.toString('base64')}.${encrypted.toString('base64')}.${authTag.toString(
      'base64'
    )}`,
    2
  )
}

export function aesGCMDecrypt({
  data: dataWithVersion,
  password,
}: {
  data: string
  password: string
}): string {
  const crypto = getCrypto()
  const {data, version} = parseStringWithVersion(dataWithVersion)
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 12)

  if (version > 0) {
    const [ivBase64, encrypted, authTag] = data.split('.')
    if (!authTag || !encrypted || !ivBase64) throw new Error('Bad data')

    const decipher = crypto.createDecipheriv(
      CYPHER_ALGORITHM,
      cipherKey,
      Buffer.from(ivBase64, 'base64')
    )

    decipher.setAuthTag(Buffer.from(authTag, 'base64'))

    return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
      'utf8'
    )}`
  }

  const [encrypted, authTag] = data.split('.')
  if (!authTag || !encrypted) throw new Error('Bad data')
  const decipher = crypto.createDecipheriv(CYPHER_ALGORITHM, cipherKey, iv)
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

/**
 * Will encrypt data as GCM would but will not generate TAG. Uses CTR with special tag, to simulate GCM encryption.
 * @param data
 * @param password
 */
export function aesGCMIgnoreTagEncrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const crypto = getCrypto()
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    'sha1'
  )

  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = Buffer.concat([
    stretchedPass.subarray(32, 32 + 12),
    Buffer.from([0, 0, 0, 2]),
  ])

  const cipher = crypto.createCipheriv('aes-256-ctr', cipherKey, iv)
  cipher.setAutoPadding(false)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])

  return encrypted.toString('base64')
}

/**
 * Will decrypt data as GCM would but will not generate TAG. Uses CTR with special tag, to simulate GCM decryption.
 * @param data
 * @param password
 */
export function aesGCMIgnoreTagDecrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const crypto = getCrypto()
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    108,
    'sha1'
  )

  const decipher = crypto.createDecipheriv(
    'aes-256-ctr',
    stretchedPass.subarray(0, 32),
    Buffer.concat([
      stretchedPass.subarray(32, 32 + 12),
      Buffer.from([0, 0, 0, 2]),
    ])
  )

  return removeEmptyBytesAtTheEnd(
    Buffer.concat([decipher.update(data, 'base64'), decipher.final()])
  ).toString('utf8')
}

export function aesCTREncrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const crypto = getCrypto()
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 16,
    'sha1'
  )

  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 16)

  const cipher = crypto.createCipheriv('aes-256-ctr', cipherKey, iv)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  // const authTag = cipher.getAuthTag();

  return appendVersion(`${encrypted.toString('base64')}`, 1)
}

export function aesCTRDecrypt({
  data: dataWithVersion,
  password,
}: {
  data: string
  password: string
}): string {
  const crypto = getCrypto()
  const data = dataWithVersion
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 16,
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)

  const iv = stretchedPass.subarray(32, 32 + 16)

  const decipher = crypto.createDecipheriv('aes-256-ctr', cipherKey, iv)

  const encrypted = data.split('.')[1]
  if (!encrypted) throw new Error('Bad data')

  return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

export async function aesCTRDecryptPromise({
  data: dataWithVersion,
  password,
}: {
  data: string
  password: string
}): Promise<string> {
  const crypto = getCrypto()
  const data = dataWithVersion
  const stretchedPass = await pbkdf2(
    password,
    SALT,
    PBKDF2ITER,
    32 + 16,
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)

  const iv = stretchedPass.subarray(32, 32 + 16)

  const decipher = crypto.createDecipheriv('aes-256-ctr', cipherKey, iv)

  const encrypted = data.split('.')[1]
  if (!encrypted) throw new Error('Bad data')

  return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

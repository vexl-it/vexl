import crypto from 'node:crypto'
import {appendVersion, parseStringWithVersion} from './versionWrapper.js'
import {PrivateKey, PublicKey} from './KeyHolder.js'
import {
  CURVE,
  CYPHER_ALGORITHM,
  HMAC_ALGORITHM,
  PBKDF2ITER,
  SALT,
} from './constants'

export function ecdsaSign({
  challenge,
  privateKey,
}: {
  challenge: string
  privateKey: PrivateKey
}): string {
  const sign = crypto.createSign('SHA256')
  sign.update(Buffer.from(challenge, 'utf8'))
  sign.end()

  const signature = sign.sign(privateKey.privateKeyPem)
  const removedSignature = trimBase64Der(signature).toString('base64')

  return removedSignature
}

export function ecdsaVerify({
  challenge,
  signature,
  pubKey,
}: {
  challenge: string
  signature: string
  pubKey: PublicKey
}): boolean {
  const verify = crypto.createVerify('SHA256')
  verify.update(Buffer.from(challenge, 'utf8'))
  verify.end()

  return verify.verify(
    pubKey.publicKeyPem,
    trimBase64Der(Buffer.from(signature, 'base64'))
  )
}

export function aesEncrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    'sha1'
  )

  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 12)

  const cipher = crypto.createCipheriv(CYPHER_ALGORITHM, cipherKey, iv)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return appendVersion(
    `${encrypted.toString('base64')}.${authTag.toString('base64')}`,
    1
  )
}

export function aesGCMIgnoreTagEncrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    'sha1'
  )

  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = Buffer.concat([
    stretchedPass.subarray(32, 32 + 12),
    Buffer.from([0, 0, 0, 1]),
  ])

  const cipher = crypto.createCipheriv('aes-256-ctr', cipherKey, iv)
  cipher.setAutoPadding(false)

  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  // const authTag = cipher.getAuthTag();

  return appendVersion(`${encrypted.toString('base64')}`, 1)
}

export function aesDecrypt({
  data: dataWithVersion,
  password,
}: {
  data: string
  password: string
}): string {
  const {data} = parseStringWithVersion(dataWithVersion)
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 12)

  const decipher = crypto.createDecipheriv(CYPHER_ALGORITHM, cipherKey, iv)

  const [encrypted, authTag] = data.split('.')
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

export function aesGCMIgnoreTagDecrypt({
  data: dataWithVersion,
  password,
}: {
  data: string
  password: string
}): string {
  const data = dataWithVersion
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)

  const iv = Buffer.concat([
    stretchedPass.subarray(32, 32 + 12),
    Buffer.from([0, 0, 0, 2]),
  ])

  const decipher = crypto.createDecipheriv('aes-256-ctr', cipherKey, iv)

  const [encrypted] = data.split('.')

  return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

export function aesCTREncrypt({
  data,
  password,
}: {
  data: string
  password: string
}): string {
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 16,
    // TODO sha1 or sha256?
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
  const data = dataWithVersion
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 16,
    // TODO sha1 or sha256?
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)

  const iv = stretchedPass.subarray(32, 32 + 16)

  const decipher = crypto.createDecipheriv('aes-256-ctr', cipherKey, iv)

  const [_, encrypted] = data.split('.')

  return `${decipher.update(encrypted, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

export function eciesEncrypt({
  publicKey,
  data,
}: {
  publicKey: PublicKey
  data: string
}): string {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.generateKeys()

  const epk = ecdh.getPublicKey()

  const sharedSecret = ecdh.computeSecret(publicKey.publicKeyRaw)

  const stretchedPass = crypto.pbkdf2Sync(
    sharedSecret,
    SALT,
    PBKDF2ITER,
    32 + 12,
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 12)

  const cipher = crypto.createCipheriv(CYPHER_ALGORITHM, cipherKey, iv)
  const cipherText = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ])
  const securityTag = cipher.getAuthTag()

  const mac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      crypto
        .pbkdf2Sync(sharedSecret, SALT, PBKDF2ITER, 108, 'sha256')
        .subarray(44, 44 + 64)
    )
    .update(cipherText.toString('base64'))
    .digest()

  return appendVersion(
    [
      cipherText.toString('base64'),
      mac.toString('base64'),
      epk.toString('base64'),
      securityTag.toString('base64'),
    ].join('.'),
    1
  )
}

export function eciesDecrypt({
  privateKey,
  data: dataBase64,
}: {
  privateKey: PrivateKey
  data: string
}): string {
  const {data} = parseStringWithVersion(dataBase64)
  const [cipherText, mac, epk, securityTag] = data.split('.')

  const ecdh = crypto.createECDH(CURVE)
  ecdh.setPrivateKey(privateKey.privateKeyRaw)

  const sharedSecret = ecdh.computeSecret(epk, 'base64')

  const computedMac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      crypto
        .pbkdf2Sync(sharedSecret, SALT, PBKDF2ITER, 108, 'sha256')
        .subarray(44, 44 + 64)
    )
    .update(cipherText)
    .digest('base64')

  if (computedMac !== mac) {
    throw new Error('MAC mismatch')
  }

  const stretchedPass = crypto.pbkdf2Sync(
    ecdh.computeSecret(Buffer.from(epk, 'base64')),
    SALT,
    PBKDF2ITER,
    32 + 12,
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 12)

  const decipher = crypto.createDecipheriv(CYPHER_ALGORITHM, cipherKey, iv)
  decipher.setAuthTag(Buffer.from(securityTag, 'base64'))

  return `${decipher.update(cipherText, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}
export async function eciesCTREncrypt({
  publicKey,
  data,
}: {
  publicKey: PublicKey
  data: string
}): Promise<string> {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.generateKeys()

  const epk = ecdh.getPublicKey()

  const time = Date.now()
  const sharedSecret = ecdh.computeSecret(publicKey.publicKeyRaw)
  console.log('total time', Date.now() - time)

  const stretchedPass = await pbkdf2(
    sharedSecret,
    SALT,
    PBKDF2ITER,
    32 + 16,
    'sha1'
  )

  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 16)

  const cipher = crypto.createCipheriv('aes-256-ctr', cipherKey, iv)
  const cipherText = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ])

  const mac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      crypto
        .pbkdf2Sync(sharedSecret, SALT, PBKDF2ITER, 108, 'sha256')
        .subarray(44, 44 + 64)
    )
    .update(cipherText.toString('base64'))
    .digest()

  return appendVersion(
    [
      cipherText.toString('base64'),
      mac.toString('base64'),
      epk.toString('base64'),
    ].join('.'),
    1
  )
}

export async function eciesCTRDecrypt({
  privateKey,
  data: dataBase64,
}: {
  privateKey: PrivateKey
  data: string
}): Promise<string> {
  const {data} = parseStringWithVersion(dataBase64)
  const [cipherText, mac, epk] = data.split('.')

  const ecdh = crypto.createECDH(CURVE)
  ecdh.setPrivateKey(privateKey.privateKeyRaw)

  const sharedSecret = ecdh.computeSecret(epk, 'base64')

  const computedMac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      crypto
        .pbkdf2Sync(sharedSecret, SALT, PBKDF2ITER, 108, 'sha256')
        .subarray(44, 44 + 64)
    )
    .update(cipherText)
    .digest('base64')

  if (computedMac !== mac) {
    throw new Error('MAC mismatch')
  }

  const stretchedPass = await pbkdf2(
    ecdh.computeSecret(Buffer.from(epk, 'base64')),
    SALT,
    PBKDF2ITER,
    32 + 16,
    'sha1'
  )
  const cipherKey = stretchedPass.subarray(0, 32)
  const iv = stretchedPass.subarray(32, 32 + 16)

  const decipher = crypto.createDecipheriv('aes-256-ctr', cipherKey, iv)

  return `${decipher.update(cipherText, 'base64', 'utf8')}${decipher.final(
    'utf8'
  )}`
}

async function pbkdf2(
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  iterations: number,
  keylen: number,
  digest: string
): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keylen,
      digest,
      (err, derivedKey) => {
        if (err != null) reject(err)
        else resolve(derivedKey)
      }
    )
  })
}

export function hmacSign({
  password,
  data,
}: {
  password: string
  data: string
}): string {
  const stretched = crypto
    .pbkdf2Sync(password, SALT, PBKDF2ITER, 108, 'sha256')
    .subarray(44, 44 + 64)

  const result = crypto
    .createHmac(HMAC_ALGORITHM, stretched)
    .update(data)
    .digest('base64')
  return result
}

export function hmacVerify({
  password,
  data,
  signature,
}: {
  password: string
  data: string
  signature: string
}): boolean {
  const stretched = crypto
    .pbkdf2Sync(password, SALT, PBKDF2ITER, 108, 'sha256')
    .subarray(44, 44 + 64)

  const hmac = crypto.createHmac(HMAC_ALGORITHM, stretched)
  const hash = hmac.update(data).digest('base64')
  return hash === signature
}

function trimBase64Der(data: Buffer): Buffer {
  const length = data[1]
  if (length == null) throw new Error('Invalid der')
  return data.subarray(0, length + 2)
}

export {PrivateKey, PublicKey}

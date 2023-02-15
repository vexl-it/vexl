import {type PrivateKey, type PublicKey} from '../KeyHolder'
import crypto from 'node:crypto'
import {
  CURVE,
  CYPHER_ALGORITHM,
  HMAC_ALGORITHM,
  PBKDF2ITER,
  SALT,
} from '../constants'
import {appendVersion, parseStringWithVersion} from '../versionWrapper'
import pbkdf2 from './pbkdf2Promise'

export async function eciesGTMEncrypt({
  publicKey,
  data,
}: {
  publicKey: PublicKey
  data: string
}): Promise<string> {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.generateKeys()

  const epk = ecdh.getPublicKey()

  const sharedSecret = ecdh.computeSecret(publicKey.publicKeyRaw)

  const stretchedPass = await pbkdf2(
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

export async function eciesGTMDecrypt({
  privateKey,
  data: dataBase64,
}: {
  privateKey: PrivateKey
  data: string
}): Promise<string> {
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

  const stretchedPass = await pbkdf2(
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

  const sharedSecret = ecdh.computeSecret(publicKey.publicKeyRaw)

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

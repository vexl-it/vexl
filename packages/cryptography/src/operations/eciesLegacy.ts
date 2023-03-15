import {CURVE, HMAC_ALGORITHM, PBKDF2ITER, SALT} from '../constants'
import crypto from 'node:crypto'
import pbkdf2 from './pbkdf2Promise'
import {removeEmptyBytesAtTheEnd} from '../utils'
import {type PrivateKeyHolder, type PublicKeyHolder} from '../KeyHolder/brands'

function encodePart(data: Buffer): string {
  const base64 = data.toString('base64')
  return `${base64.length}A${base64}`
}

export async function eciesLegacyEncrypt({
  publicKey,
  data,
}: {
  publicKey: PublicKeyHolder
  data: string
}): Promise<string> {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.generateKeys()

  const epk = ecdh.getPublicKey()
  const sharedSecret = ecdh.computeSecret(
    Buffer.from(publicKey.publicKeyRaw, 'base64')
  )

  const stretchedPass = await pbkdf2(
    sharedSecret,
    SALT,
    PBKDF2ITER,
    108,
    'sha1'
  )

  const cipher = crypto.createCipheriv(
    'aes-256-ctr',
    stretchedPass.subarray(0, 32),
    Buffer.concat([
      stretchedPass.subarray(32, 32 + 12),
      Buffer.from([0, 0, 0, 2]),
    ])
  )

  const encryptedPayload = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ])

  const mac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      (await pbkdf2(sharedSecret, SALT, PBKDF2ITER, 108, 'sha256')).subarray(
        44,
        44 + 64
      )
    )
    .update(encryptedPayload.toString('base64'))
    .digest()

  const cipherPart = encodePart(encryptedPayload)
  const macPart = encodePart(mac)
  const epkPart = encodePart(epk)

  return `${cipherPart}${macPart}${epkPart}`
}

function getNextPart(
  data: string,
  startOffset: number = 0
): {part: string; inOriginalStringPartEndsAt: number} {
  const partLengthChars = []

  let partLengthIndex = startOffset
  while (data.charAt(partLengthIndex) !== 'A') {
    partLengthChars.push(data.charAt(partLengthIndex))
    partLengthIndex = partLengthIndex + 1
  }
  const partLength = parseInt(partLengthChars.join(''))
  const partEndsAt = partLengthIndex + 1 + partLength
  const part = data.slice(partLengthIndex + 1, partEndsAt)

  return {
    part,
    inOriginalStringPartEndsAt: partEndsAt,
  }
}

export async function eciesLegacyDecrypt({
  privateKey,
  data,
}: {
  privateKey: PrivateKeyHolder
  data: string
}): Promise<string> {
  const cipherPart = getNextPart(data, 0)
  const macPart = getNextPart(data, cipherPart.inOriginalStringPartEndsAt)
  const epkPart = getNextPart(data, macPart.inOriginalStringPartEndsAt)

  const ecdh = crypto.createECDH(CURVE)
  ecdh.setPrivateKey(Buffer.from(privateKey.privateKeyRaw, 'base64'))

  const sharedSecret = ecdh.computeSecret(epkPart.part, 'base64')

  const mac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      (await pbkdf2(sharedSecret, SALT, PBKDF2ITER, 108, 'sha256')).subarray(
        44,
        44 + 64
      )
    )
    .update(cipherPart.part)
    .digest('base64')

  if (mac !== macPart.part) {
    throw new Error('MAC does not match')
  }

  const stretchedPass = await pbkdf2(
    sharedSecret,
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

  const decodedBuffer = Buffer.concat([
    decipher.update(cipherPart.part, 'base64'),
    decipher.final(),
  ])
  return removeEmptyBytesAtTheEnd(decodedBuffer).toString('utf8')
}

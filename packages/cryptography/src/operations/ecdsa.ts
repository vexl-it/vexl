import {getCrypto} from '../getCrypto'
import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '../KeyHolder/brands'

/**
 * Decode base64-encoded PEM key to UTF-8 PEM string
 */
function decodePemKey(
  pemBase64: PrivateKeyPemBase64 | PublicKeyPemBase64
): string {
  return Buffer.from(pemBase64, 'base64').toString('utf-8')
}

export function ecdsaSign({
  challenge,
  privateKey,
}: {
  challenge: string
  privateKey: PrivateKeyPemBase64
}): string {
  const crypto = getCrypto()
  const sign = crypto.createSign('sha256')
  sign.update(Buffer.from(challenge, 'utf8'))

  const signature = sign.sign(decodePemKey(privateKey))
  return trimBase64Der(signature).toString('base64')
}

export function ecdsaVerify({
  challenge,
  signature,
  pubKey,
}: {
  challenge: string
  signature: string
  pubKey: PublicKeyPemBase64
}): boolean {
  const crypto = getCrypto()
  const verify = crypto.createVerify('SHA256')
  verify.update(Buffer.from(challenge, 'utf8'))

  return verify.verify(
    decodePemKey(pubKey),
    trimBase64Der(Buffer.from(signature, 'base64'))
  )
}

function trimBase64Der(data: Buffer): Buffer {
  const length = data[1]
  if (length == null) throw new Error('Invalid der')
  return data.subarray(0, length + 2)
}

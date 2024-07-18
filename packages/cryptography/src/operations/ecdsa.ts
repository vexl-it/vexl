import crypto from 'node:crypto'
import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '../KeyHolder/brands'

export function ecdsaSign({
  challenge,
  privateKey,
}: {
  challenge: string
  privateKey: PrivateKeyPemBase64
}): string {
  const sign = crypto.createSign('sha256')
  sign.update(Buffer.from(challenge, 'utf8'))
  sign.end()

  const signature = sign.sign(Buffer.from(privateKey, 'base64'))
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
  const verify = crypto.createVerify('SHA256')
  verify.update(Buffer.from(challenge, 'utf8'))
  verify.end()

  return verify.verify(
    Buffer.from(pubKey, 'base64'),
    trimBase64Der(Buffer.from(signature, 'base64'))
  )
}

function trimBase64Der(data: Buffer): Buffer {
  const length = data[1]
  if (length == null) throw new Error('Invalid der')
  return data.subarray(0, length + 2)
}

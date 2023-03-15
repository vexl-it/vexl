import crypto from 'node:crypto'
import {type PrivateKeyHolder, type PublicKeyHolder} from '../KeyHolder/brands'

export function ecdsaSign({
  challenge,
  privateKey,
}: {
  challenge: string
  privateKey: PrivateKeyHolder
}): string {
  const sign = crypto.createSign('SHA256')
  sign.update(Buffer.from(challenge, 'utf8'))
  sign.end()

  const signature = sign.sign(
    Buffer.from(privateKey.privateKeyPemBase64, 'base64')
  )
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
  pubKey: PublicKeyHolder
}): boolean {
  const verify = crypto.createVerify('SHA256')
  verify.update(Buffer.from(challenge, 'utf8'))
  verify.end()

  return verify.verify(
    Buffer.from(pubKey.publicKeyPemBase64, 'base64'),
    trimBase64Der(Buffer.from(signature, 'base64'))
  )
}

function trimBase64Der(data: Buffer): Buffer {
  const length = data[1]
  if (length == null) throw new Error('Invalid der')
  return data.subarray(0, length + 2)
}

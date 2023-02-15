import {type PrivateKey, type PublicKey} from '../KeyHolder'
import crypto from 'node:crypto'

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

function trimBase64Der(data: Buffer): Buffer {
  const length = data[1]
  if (length == null) throw new Error('Invalid der')
  return data.subarray(0, length + 2)
}

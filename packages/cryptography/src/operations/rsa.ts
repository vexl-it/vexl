import {getCrypto} from '../getCrypto'

/** RSASSA-PKCS1-v1_5 with SHA-256 (`rsa-v1_5-sha256`), the scheme Expo signs over-the-air updates with. */
export function rsaSha256Sign({
  message,
  privateKeyPem,
}: {
  message: string
  privateKeyPem: string
}): string {
  const sign = getCrypto().createSign('SHA256')
  sign.update(Buffer.from(message, 'utf8'))
  sign.end()

  return sign.sign(Buffer.from(privateKeyPem, 'utf8')).toString('base64')
}

export function rsaSha256Verify({
  message,
  signature,
  publicKeyPem,
}: {
  message: string
  signature: string
  publicKeyPem: string
}): boolean {
  const verify = getCrypto().createVerify('SHA256')
  verify.update(Buffer.from(message, 'utf8'))
  verify.end()

  return verify.verify(
    Buffer.from(publicKeyPem, 'utf8'),
    Buffer.from(signature, 'base64')
  )
}

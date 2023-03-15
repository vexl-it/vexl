import {
  PrivateKeyHolder,
  PrivateKeyPemBase64,
  PrivateKeyRaw,
  PublicKeyHolder,
  PublicKeyPemBase64,
  PublicKeyRaw,
} from './brands'
import {
  privatePemToRaw,
  privateRawToPem,
  publicPemFromPrivatePem,
  publicPemToRaw,
  publicRawToPem,
} from './keyUtils'
import crypto from 'node:crypto'
import {CURVE} from '../constants'

function importPublicKey(args: {
  publicKeyPemBase64: PublicKeyPemBase64
}): PublicKeyHolder
function importPublicKey(args: {publicKeyRaw: PublicKeyRaw}): PublicKeyHolder
function importPublicKey({
  publicKeyPemBase64,
  publicKeyRaw,
}: {
  publicKeyPemBase64?: PublicKeyPemBase64
  publicKeyRaw?: PublicKeyRaw
}): PublicKeyHolder {
  if (publicKeyPemBase64) {
    return {
      publicKeyPemBase64,
      publicKeyRaw: PublicKeyRaw.parse(
        publicPemToRaw(Buffer.from(publicKeyPemBase64, 'base64')).toString(
          'base64'
        )
      ),
    }
  }

  if (publicKeyRaw) {
    return {
      publicKeyRaw,
      publicKeyPemBase64: PublicKeyPemBase64.parse(
        publicRawToPem(Buffer.from(publicKeyRaw, 'base64')).toString('base64')
      ),
    }
  }

  throw new Error('Public key is required in at least one format') // Should not happen due to overload definition
}

function importPrivateKey(args: {
  privateKeyPemBase64: PrivateKeyPemBase64
}): PrivateKeyHolder
function importPrivateKey(args: {
  privateKeyRaw: PrivateKeyRaw
}): PrivateKeyHolder
function importPrivateKey({
  privateKeyPemBase64,
  privateKeyRaw,
}: {
  privateKeyPemBase64?: PrivateKeyPemBase64
  privateKeyRaw?: PrivateKeyRaw
}): PrivateKeyHolder {
  if (privateKeyPemBase64) {
    const privateKeyPemBuffer = Buffer.from(privateKeyPemBase64, 'base64')
    const {privateKey: privateKeyRawBuffer} =
      privatePemToRaw(privateKeyPemBuffer)
    const publicKeyPemBuffer = publicPemFromPrivatePem(privateKeyPemBuffer)
    const publicKeyRawBuffer = publicPemToRaw(publicKeyPemBuffer)

    return {
      privateKeyPemBase64,
      privateKeyRaw: PrivateKeyRaw.parse(
        privateKeyRawBuffer.toString('base64')
      ),
      publicKeyPemBase64: PublicKeyPemBase64.parse(
        publicKeyPemBuffer.toString('base64')
      ),
      publicKeyRaw: PublicKeyRaw.parse(publicKeyRawBuffer.toString('base64')),
    }
  }

  if (privateKeyRaw) {
    const privateKeyRawBuffer = Buffer.from(privateKeyRaw, 'base64')
    const privateKeyPemBuffer = privateRawToPem(privateKeyRawBuffer)
    const publicKeyPemBuffer = publicPemFromPrivatePem(privateKeyPemBuffer)
    const publicKeyRawBuffer = publicPemToRaw(publicKeyPemBuffer)

    return {
      privateKeyRaw,
      privateKeyPemBase64: PrivateKeyPemBase64.parse(
        privateKeyPemBuffer.toString('base64')
      ),
      publicKeyPemBase64: PublicKeyPemBase64.parse(
        publicKeyPemBuffer.toString('base64')
      ),
      publicKeyRaw: PublicKeyRaw.parse(publicKeyRawBuffer.toString('base64')),
    }
  }

  throw new Error('Private key is required in at least one format') // Should not happen due to overloads
}

function generatePrivateKey(): PrivateKeyHolder {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.generateKeys()
  return importPrivateKey({
    privateKeyRaw: PrivateKeyRaw.parse(ecdh.getPrivateKey().toString('base64')),
  })
}

export {
  importPublicKey,
  importPrivateKey,
  generatePrivateKey,
  PrivateKeyHolder,
  PublicKeyHolder,
  PublicKeyPemBase64,
  PrivateKeyPemBase64,
  PrivateKeyRaw,
  PublicKeyRaw,
}

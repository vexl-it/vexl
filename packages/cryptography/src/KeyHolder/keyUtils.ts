import crypto from 'node:crypto'
import ECConverter from './ECConverter'
import {type PrivateKeyPemBase64, PublicKeyPemBase64} from './brands'
import {type Curve, normalizeCurveName} from './Curve.brand'

function decodeBase64Url(string: string): Buffer {
  // Replace non-url compatible chars with base64 standard chars
  let urlUnsafe = string.replace(/-/g, '+').replace(/_/g, '/')

  // Pad out with standard base64 required padding characters
  const pad = urlUnsafe.length % 4
  if (pad !== 0) {
    if (pad === 1) {
      throw new Error(
        'InvalidLengthError: Input base64url string is the wrong length to determine padding'
      )
    }
    urlUnsafe += new Array(5 - pad).join('=')
  }

  return Buffer.from(urlUnsafe, 'base64')
}

function base64pemKeToUtf8(
  key: PrivateKeyPemBase64 | PublicKeyPemBase64
): string {
  return Buffer.from(key, 'base64').toString('utf-8')
}

function getPubKey(privateKeyRaw: Buffer, curve: Curve): Buffer {
  const ecdh = crypto.createECDH(curve)
  ecdh.setPrivateKey(privateKeyRaw)
  return ecdh.getPublicKey()
}

export function privateRawToPem(rawPriv: Buffer, curve: Curve): Buffer {
  const key = new ECConverter({
    privateKey: rawPriv,
    publicKey: getPubKey(rawPriv, curve),
    curve,
  })

  return key.toBuffer('pem')
}

export function publicPemFromPrivatePem(
  privateKey: PrivateKeyPemBase64
): PublicKeyPemBase64 {
  const {publicKey: publicKeyRaw, curve} = privatePemToRaw(privateKey)

  return PublicKeyPemBase64.parse(
    publicRawToPem(publicKeyRaw, curve).toString('base64')
  )
}

export function publicRawToPem(publicKeyRaw: Buffer, curve: Curve): Buffer {
  const key = new ECConverter({publicKey: publicKeyRaw, curve})
  return key.toBuffer('pem')
}

export function publicPemToRaw(publicKeyPem: PublicKeyPemBase64): {
  publicKey: Buffer
  curve: Curve
} {
  const key = new ECConverter(base64pemKeToUtf8(publicKeyPem), 'pem')
  const json = key.toJSON()
  const curve = normalizeCurveName(json.crv)

  const publicKeyRaw = Buffer.concat([
    Buffer.from('04', 'hex'),
    decodeBase64Url(json.x),
    decodeBase64Url(json.y),
  ])

  return {
    curve,
    publicKey: publicKeyRaw,
  }
}

export function privatePemToRaw(privPemPKC8: PrivateKeyPemBase64): {
  privateKey: Buffer
  publicKey: Buffer
  curve: Curve
} {
  const key = new ECConverter(base64pemKeToUtf8(privPemPKC8), 'pem')

  const json = key.toJSON()
  const curve = normalizeCurveName(json.crv)

  return {
    privateKey: decodeBase64Url(json.d as any),
    publicKey: Buffer.concat([
      Buffer.from('04', 'hex'),
      decodeBase64Url(json.x),
      decodeBase64Url(json.y),
    ]),
    curve,
  }
}

export function getCurveName(
  keyPemBase64: PublicKeyPemBase64 | PrivateKeyPemBase64
): Curve {
  const key = new ECConverter(Buffer.from(keyPemBase64, 'base64'), 'pem')
  const json = key.toJSON()
  return normalizeCurveName(json.crv)
}

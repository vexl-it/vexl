import crypto from 'node:crypto'
import ECConverter from './ECConverter'
import {CURVE} from '../constants'

export function decodeBase64Url(string: string): Buffer {
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

export function getPubKey(privateKey: Buffer): Buffer {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.setPrivateKey(privateKey)
  return ecdh.getPublicKey()
}

export function privateRawToPem(rawPriv: Buffer): Buffer {
  const key = new ECConverter({
    privateKey: rawPriv,
    publicKey: getPubKey(rawPriv),
    curve: CURVE,
  })

  return key.toBuffer('pem')
}

export function privatePemToRaw(privPemPKC8: Buffer): {
  privateKey: Buffer
  publicKey: Buffer
} {
  const key = new ECConverter(privPemPKC8, 'pem')

  const json = key.toJSON()

  return {
    privateKey: decodeBase64Url(json.d as any),
    publicKey: Buffer.concat([
      Buffer.from('04', 'hex'),
      decodeBase64Url(json.x),
      decodeBase64Url(json.y),
    ]),
  }
}

export function publicPemFromPrivatePem(privatePem: Buffer): Buffer {
  const privateRaw = privatePemToRaw(privatePem)
  const publicRaw = getPubKey(privateRaw.privateKey)
  return publicRawToPem(publicRaw)
}

export function publicRawToPem(publicKeyRaw: Buffer): Buffer {
  const key = new ECConverter({publicKey: publicKeyRaw, curve: CURVE})
  return key.toBuffer('pem')
}

export function publicPemToRaw(publicKeyPem: Buffer): Buffer {
  const key = new ECConverter(publicKeyPem, 'pem')
  const json = key.toJSON()
  return Buffer.concat([
    Buffer.from('04', 'hex'),
    decodeBase64Url(json.x),
    decodeBase64Url(json.y),
  ])
}

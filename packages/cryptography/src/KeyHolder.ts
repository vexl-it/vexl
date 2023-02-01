import crypto from 'node:crypto'
import {CURVE} from './constants.js'
// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
// @ts-ignore
import ECConverter from './ECConverter/index.js'

export enum KeyFormat {
  PEM = 'pem',
  RAW = 'raw',
  PEM_BASE64 = 'pemBase64',
}

export class PublicKey {
  protected constructor(
    readonly publicKeyPem: Buffer,
    readonly publicKeyRaw: Buffer
  ) {}

  exportPublicKey(format: KeyFormat = KeyFormat.PEM_BASE64): string {
    if (format === KeyFormat.PEM) return this.publicKeyPem.toString()
    if (format === KeyFormat.RAW) return this.publicKeyRaw.toString('base64')
    return this.publicKeyPem.toString('base64')
  }

  equals(other: PublicKey): boolean {
    return (
      other instanceof PublicKey &&
      Buffer.compare(this.publicKeyRaw, other.publicKeyRaw) === 0 &&
      Buffer.compare(this.publicKeyPem, other.publicKeyPem) === 0
    )
  }

  toLog(): unknown {
    const pemKey = this.exportPublicKey(KeyFormat.PEM)
    const pemBase64 = this.exportPublicKey(KeyFormat.PEM_BASE64)
    const rawKey = this.exportPublicKey(KeyFormat.RAW)

    return {publicKey: {pemKey, pemBase64, rawKey}}
  }

  static import({key, type}: {key: string; type: KeyFormat}): PublicKey {
    if (type === KeyFormat.PEM || type === KeyFormat.PEM_BASE64) {
      const publicKeyPem = Buffer.from(
        key,
        type === KeyFormat.PEM_BASE64 ? 'base64' : 'utf-8'
      )
      const publicKeyRaw = publicPemToRaw(publicKeyPem)

      return new PublicKey(publicKeyPem, publicKeyRaw)
    } else {
      const publicKeyRaw = Buffer.from(key, 'base64')
      const publicKeyPem = publicRawToPem(publicKeyRaw)

      return new PublicKey(publicKeyPem, publicKeyRaw)
    }
  }
}

export class PrivateKey extends PublicKey {
  private constructor(
    readonly privateKeyPem: Buffer,
    readonly privateKeyRaw: Buffer,
    publicKeyPem: Buffer,
    publicKeyRaw: Buffer
  ) {
    super(publicKeyPem, publicKeyRaw)
  }

  exportPrivateKey(format: KeyFormat = KeyFormat.PEM_BASE64): string {
    if (format === 'pem') return this.privateKeyPem.toString()
    if (format === 'raw') return this.privateKeyRaw.toString('base64')
    return this.privateKeyPem.toString('base64')
  }

  equals(other: PublicKey): boolean {
    return (
      other instanceof PrivateKey &&
      Buffer.compare(this.privateKeyRaw, other.privateKeyRaw) === 0 &&
      Buffer.compare(this.privateKeyPem, other.privateKeyPem) === 0 &&
      Buffer.compare(this.publicKeyRaw, other.publicKeyRaw) === 0 &&
      Buffer.compare(this.publicKeyPem, other.publicKeyPem) === 0
    )
  }

  toLog(): unknown {
    const pemKey = this.exportPrivateKey(KeyFormat.PEM)
    const pemBase64 = this.exportPrivateKey(KeyFormat.PEM_BASE64)
    const rawKey = this.exportPrivateKey(KeyFormat.RAW)

    return {privateKey: {pemKey, pemBase64, rawKey}, ...(super.toLog() as any)}
  }

  static import({
    key,
    type = KeyFormat.PEM_BASE64,
  }: {
    key: string
    type: KeyFormat
  }): PrivateKey {
    if (type === KeyFormat.PEM || type === KeyFormat.PEM_BASE64) {
      const privateKeyPem = Buffer.from(
        key,
        type === KeyFormat.PEM_BASE64 ? 'base64' : 'utf-8'
      )

      const {privateKey: privateKeyRaw} = privatePemToRaw(privateKeyPem)

      const publicKeyPem = publicPemFromPrivatePem(privateKeyPem)
      const publicKeyRaw = publicPemToRaw(publicKeyPem)
      return new PrivateKey(
        privateKeyPem,
        privateKeyRaw,
        publicKeyPem,
        publicKeyRaw
      )
    } else {
      const privateKeyRaw = Buffer.from(key, 'base64')
      const privateKeyPem = privateRawToPem(privateKeyRaw)

      const publicKeyPem = publicPemFromPrivatePem(privateKeyPem)
      const publicKeyRaw = publicPemToRaw(publicKeyPem)
      return new PrivateKey(
        privateKeyPem,
        privateKeyRaw,
        publicKeyPem,
        publicKeyRaw
      )
    }
  }

  static generate(): PrivateKey {
    const ecdh = crypto.createECDH(CURVE)
    ecdh.generateKeys()

    return PrivateKey.import({
      key: ecdh.getPrivateKey('base64'),
      type: KeyFormat.RAW,
    })
  }
}

// ----------- utility methods -------------

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

function getPubKey(privateKey: Buffer): Buffer {
  const ecdh = crypto.createECDH(CURVE)
  ecdh.setPrivateKey(privateKey)
  return ecdh.getPublicKey()
}

function privateRawToPem(rawPriv: Buffer): Buffer {
  const key = new ECConverter({
    privateKey: rawPriv,
    publicKey: getPubKey(rawPriv),
    curve: CURVE,
  })

  return key.toBuffer('pem')
}

function privatePemToRaw(privPemPKC8: Buffer): {
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

function publicPemFromPrivatePem(privatePem: Buffer): Buffer {
  const privateRaw = privatePemToRaw(privatePem)
  const publicRaw = getPubKey(privateRaw.privateKey)
  return publicRawToPem(publicRaw)
}

function publicRawToPem(publicKeyRaw: Buffer): Buffer {
  const key = new ECConverter({publicKey: publicKeyRaw, curve: CURVE})
  return key.toBuffer('pem')
}

function publicPemToRaw(publicKeyPem: Buffer): Buffer {
  const key = new ECConverter(publicKeyPem, 'pem')
  const json = key.toJSON()
  return Buffer.concat([
    Buffer.from('04', 'hex'),
    decodeBase64Url(json.x),
    decodeBase64Url(json.y),
  ])
}

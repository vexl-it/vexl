import crypto from 'node:crypto'
import {CURVE} from '../constants'
import PublicKey from './PublicKey'
import KeyFormat from './KeyFormat'
import {
  privatePemToRaw,
  privateRawToPem,
  publicPemFromPrivatePem,
  publicPemToRaw,
} from './keyUtils'

export default class PrivateKey extends PublicKey {
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

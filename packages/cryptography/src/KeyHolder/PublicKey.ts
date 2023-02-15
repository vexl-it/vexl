import KeyFormat from './KeyFormat'
import {publicPemToRaw, publicRawToPem} from './keyUtils'

export default class PublicKey {
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

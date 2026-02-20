import {Schema} from 'effect/index'
import {getCrypto} from '../getCrypto'
import {defaultCurve, type Curve} from './Curve.brand'
import {
  PrivateKeyHolder,
  PrivateKeyPemBase64,
  PublicKeyPemBase64,
} from './brands'
import {KeyPairV2, PrivateKeyV2, PublicKeyV2} from './brandsV2'
import {
  privateRawToPem,
  publicPemFromPrivatePem,
  publicRawToPem,
} from './keyUtils'

function importPrivateKey({
  privateKeyPemBase64,
}: {
  privateKeyPemBase64: PrivateKeyPemBase64
}): PrivateKeyHolder {
  const publicKeyPemBase64 = publicPemFromPrivatePem(privateKeyPemBase64)

  return {
    privateKeyPemBase64,
    publicKeyPemBase64,
  }
}

export function importKeyPair(
  privateKey: PrivateKeyPemBase64
): PrivateKeyHolder {
  const publicKeyPemBase64 = publicPemFromPrivatePem(privateKey)

  return {
    privateKeyPemBase64: privateKey,
    publicKeyPemBase64,
  }
}

function generatePrivateKey(curve: Curve = defaultCurve): PrivateKeyHolder {
  const crypto = getCrypto()
  const ecdh = crypto.createECDH(curve)
  ecdh.generateKeys()
  const privateKeyPem = privateRawToPem(ecdh.getPrivateKey(), curve)
  const publicKeyPem = publicRawToPem(ecdh.getPublicKey(), curve)

  return Schema.decodeSync(PrivateKeyHolder)({
    publicKeyPemBase64: publicKeyPem.toString('base64'),
    privateKeyPemBase64: privateKeyPem.toString('base64'),
  })
}

export {
  generatePrivateKey,
  importPrivateKey,
  // V2 key types for libsodium
  KeyPairV2,
  PrivateKeyHolder,
  PrivateKeyPemBase64,
  PrivateKeyV2,
  PublicKeyPemBase64,
  PublicKeyV2,
}

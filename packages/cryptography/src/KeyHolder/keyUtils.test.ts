import crypto from 'crypto'
import {curves} from './Curve.brand'
import {publicRawFromPrivateRaw} from './keyUtils'

const publicRawWithEcdh = (privateKeyRaw: Buffer): Buffer => {
  const ecdh = crypto.createECDH('secp256k1')
  ecdh.setPrivateKey(privateKeyRaw)
  return ecdh.getPublicKey()
}

describe('publicRawFromPrivateRaw', () => {
  it('matches createECDH for secp256k1', () => {
    Array.from({length: 20}, () => crypto.randomBytes(32)).forEach((key) => {
      expect(publicRawFromPrivateRaw(key, curves.secp256k1)).toEqual(
        publicRawWithEcdh(key)
      )
    })
  })

  it('accepts private keys shorter than 32 bytes', () => {
    const key = Buffer.concat([Buffer.from([0]), crypto.randomBytes(31)])

    expect(publicRawFromPrivateRaw(key.subarray(1), curves.secp256k1)).toEqual(
      publicRawWithEcdh(key)
    )
  })
})

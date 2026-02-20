import {KeyHolder} from '@vexl-next/cryptography'
import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type CryptoBoxSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Schema} from 'effect/index'
import {type SessionV2} from '../../brands/Session.brand'

const dummyPrivKey = KeyHolder.generatePrivateKey()
const dummyV2KeyPair = {
  publicKey: 'V2_PUB_p6FxgibooVetxEQ0EcrVLVJCvJq0cmeNnENs00Y9Z3U',
  privateKey:
    'V2_PRIV_dIFCw3_09AW5Xaz7EADTRKE5SbJrBjCozIX12oGb-8inoXGCJuihV63ERDQRytUtUkK8mrRyZ42cQ2zTRj1ndQ',
} as KeyPairV2

export const dummySession: SessionV2 = {
  privateKey: dummyPrivKey,
  keyPairV2: dummyV2KeyPair,
  sessionCredentials: {
    hash: '' as HashedPhoneNumber,
    publicKey: dummyPrivKey.publicKeyPemBase64,
    signature: 'dummysign' as EcdsaSignature,
    vexlAuthHeader: {
      data: {
        hash: 'asdf' as HashedPhoneNumber,
        pk: dummyV2KeyPair.publicKey,
      },
      signature: 'CBSig-dummysign' as CryptoBoxSignature,
    },
  },
  phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733733733'),
  version: 1,
}

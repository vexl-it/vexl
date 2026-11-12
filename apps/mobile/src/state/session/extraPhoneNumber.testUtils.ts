import {KeyHolder} from '@vexl-next/cryptography'
import {KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {generateKeyDerivationId} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {Schema} from 'effect'
import {type ExtraSessionPhoneNumber} from '../../brands/Session.brand'
import {dummySession} from './dummySesssion'

/**
 * An extra phone number with its own keys and credentials that pass the
 * session sanity check.
 */
export const makeExtraPhoneNumber = ({
  phoneNumber,
  hash,
  index,
}: {
  phoneNumber: string
  hash: string
  index: number
}): ExtraSessionPhoneNumber => {
  const privateKey = KeyHolder.generatePrivateKey()
  const keyPairV2 = Schema.decodeSync(KeyPairV2)({
    publicKey: `V2_PUB_extra-${index}`,
    privateKey: `V2_PRIV_extra-${index}`,
  })
  const hashedPhoneNumber = Schema.decodeSync(HashedPhoneNumber)(hash)
  return {
    phoneNumber: Schema.decodeSync(E164PhoneNumber)(phoneNumber),
    privateKey,
    keyPairV2,
    keyDerivationId: generateKeyDerivationId(),
    sessionCredentials: {
      publicKey: privateKey.publicKeyPemBase64,
      hash: hashedPhoneNumber,
      signature: dummySession.sessionCredentials.signature,
      vexlAuthHeader: {
        data: {hash: hashedPhoneNumber, pk: keyPairV2.publicKey},
        signature: dummySession.sessionCredentials.vexlAuthHeader.signature,
      },
    },
  }
}

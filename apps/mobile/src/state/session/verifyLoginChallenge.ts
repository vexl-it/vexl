import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {ecdsaSignE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type UserApi} from '@vexl-next/rest-api/src/services/user'
import {type VerifyPhoneNumberResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Effect} from 'effect'

/**
 * Proves to user-service that `privateKey` belongs to the phone number that
 * was just verified by SMS and returns the V1 credentials for that number.
 */
export const verifyLoginChallenge = ({
  userApi,
  privateKey,
  challenge,
}: {
  userApi: UserApi
  privateKey: PrivateKeyHolder
  challenge: VerifyPhoneNumberResponse['challenge']
}): Effect.Effect<
  UserSessionCredentials,
  Effect.Effect.Error<
    | ReturnType<ReturnType<typeof ecdsaSignE>>
    | ReturnType<UserApi['verifyChallenge']>
  >
> =>
  ecdsaSignE(privateKey.privateKeyPemBase64)(challenge).pipe(
    Effect.flatMap((signature) =>
      userApi.verifyChallenge({
        userPublicKey: privateKey.publicKeyPemBase64,
        signature,
      })
    ),
    Effect.map(({hash, signature}) => ({
      publicKey: privateKey.publicKeyPemBase64,
      hash,
      signature,
    }))
  )

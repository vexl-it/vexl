import {HttpApiBuilder} from '@effect/platform/index'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  HashedPhoneNumberE,
  type HashedPhoneNumber,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hmacSignE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  NumberDoesNotMatchOldHashError,
  UnableToGenerateSignatureError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {
  generateUserAuthData,
  hashPhoneNumber,
} from '@vexl-next/server-utils/src/generateUserAuthData'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {oldHmacKeyUsedForHashingNumbersConfig} from '../configs'

const checkPhoneNumberAgainstOldHash = ({
  phoneNumber,
  oldHash,
}: {
  phoneNumber: E164PhoneNumber
  oldHash: HashedPhoneNumber
}): Effect.Effect<boolean, UnexpectedServerError> =>
  oldHmacKeyUsedForHashingNumbersConfig.pipe(
    Effect.flatMap((oldHmacKey) => hmacSignE(oldHmacKey)(phoneNumber)),
    Effect.flatMap(Schema.decode(HashedPhoneNumberE)),
    Effect.catchAll((e) =>
      Effect.fail(
        new UnexpectedServerError({
          status: 500,
          cause: e,
          message: 'Error while decoding the old hash',
        })
      )
    ),
    Effect.map((newHash) => newHash === oldHash)
  )

export const regenerateCredentialsHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'root',
  'regenerateSessionCredentials',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const security = yield* _(CurrentSecurity)
        if (
          !(yield* _(
            checkPhoneNumberAgainstOldHash({
              oldHash: security.hash,
              phoneNumber: req.payload.myPhoneNumber,
            })
          ))
        ) {
          return yield* _(Effect.fail(new NumberDoesNotMatchOldHashError()))
        }

        // 2. regenerate session credentials
        const newHash = yield* _(
          hashPhoneNumber(req.payload.myPhoneNumber),
          Effect.catchTag('CryptoError', (e) =>
            Effect.fail(
              new UnexpectedServerError({
                cause: e,
                message: 'Error while generating session credentials',
                status: 500,
              })
            )
          )
        )
        const authData = yield* _(
          generateUserAuthData({
            phoneNumberHashed: newHash,
            publicKey: security['public-key'],
          }),
          Effect.catchTag('CryptoError', () =>
            Effect.fail(
              new UnableToGenerateSignatureError({code: '100105', status: 400})
            )
          )
        )

        // 3. return new session credentials
        return {
          hash: authData.hash,
          signature: authData.signature,
        }
      })
    )
)

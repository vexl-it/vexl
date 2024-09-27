import {Schema} from '@effect/schema'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {hmacSignE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  NumberDoesNotMatchOldHashError,
  UnableToGenerateSignatureError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {
  RegenerateSessionCredentialsEndpoint,
  RegenerateSessionCredentialsErrors,
} from '@vexl-next/rest-api/src/services/user/specification'
import {
  generateUserAuthData,
  hashPhoneNumber,
} from '@vexl-next/server-utils/src/generateUserAuthData'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
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
          detail: 'Error while decoding the old hash',
        })
      )
    ),
    Effect.map((newHash) => newHash === oldHash)
  )

export const regenerateCredentialsHandler = Handler.make(
  RegenerateSessionCredentialsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        if (
          !(yield* _(
            checkPhoneNumberAgainstOldHash({
              oldHash: security.hash,
              phoneNumber: req.body.myPhoneNumber,
            })
          ))
        ) {
          return yield* _(Effect.fail(new NumberDoesNotMatchOldHashError()))
        }

        // 2. regenerate session credentials
        const newHash = yield* _(
          hashPhoneNumber(req.body.myPhoneNumber),
          Effect.catchTag('CryptoError', (e) =>
            Effect.fail(
              new UnexpectedServerError({
                cause: e,
                detail: 'Error while generating session credentials',
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
      }),
      RegenerateSessionCredentialsErrors
    )
)

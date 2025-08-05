import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UnixMillisecondsE,
  unixMillisecondsFromNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  AesGtmCypher,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  EraseUserVerificationId,
  InvalidVerificationIdError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type ParseError} from 'effect/ParseResult'
import {type ConfigError, Effect, Schema} from 'effect/index'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'

const VERIFICATION_EXPIRES_AFTER_MILIS = 1000 * 60 * 5 // 5 mins
export const dummySid = Schema.decodeSync(SmsVerificationSid)('dummy')

export const VerificationIdPayload = Schema.parseJson(
  Schema.Struct({
    phoneNumber: E164PhoneNumberE,
    verificationId: SmsVerificationSid,
    expiresAt: UnixMillisecondsE,
  })
)
export type VerificationIdPayload = typeof VerificationIdPayload.Type

export const createVerificationId = ({
  phoneNumber,
  verificationId,
}: VerificationIdPayload): Effect.Effect<
  EraseUserVerificationId,
  ConfigError.ConfigError | ParseError | CryptoError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)

    const dataToEncrypt = {
      phoneNumber,
      verificationId,
      expiresAt: unixMillisecondsFromNow(VERIFICATION_EXPIRES_AFTER_MILIS),
    }

    return yield* _(
      crypto.encryptAES(VerificationIdPayload)(dataToEncrypt),
      Effect.flatMap(Schema.decode(EraseUserVerificationId))
    )
  })

export const validateAndDecodeVerificationId = (
  verificationId: EraseUserVerificationId
): Effect.Effect<
  VerificationIdPayload,
  InvalidVerificationIdError | ConfigError.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    const decrypted = yield* _(
      Schema.decode(AesGtmCypher)(verificationId),
      Effect.flatMap(crypto.decryptAES(VerificationIdPayload)),
      Effect.catchTags({
        CryptoError: () =>
          new InvalidVerificationIdError({
            status: 400,
            reason: 'InvalidCypher',
          }),
        ParseError: () =>
          new InvalidVerificationIdError({
            status: 400,
            reason: 'InvalidFormat',
          }),
      })
    )

    if (unixMillisecondsFromNow(0) > decrypted.expiresAt) {
      return yield* _(
        new InvalidVerificationIdError({
          status: 400,
          reason: 'Expired',
        })
      )
    }
    return decrypted
  })

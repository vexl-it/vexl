import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UnixMilliseconds,
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
import {Effect, pipe, Schema, type Config} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'

const VERIFICATION_EXPIRES_AFTER_MILIS = 1000 * 60 * 5 // 5 mins
export const dummySid = Schema.decodeSync(SmsVerificationSid)('dummy')

export const VerificationIdPayload = Schema.fromJsonString(
  Schema.Struct({
    phoneNumber: E164PhoneNumber,
    verificationId: SmsVerificationSid,
    expiresAt: UnixMilliseconds,
  })
)
export type VerificationIdPayload = typeof VerificationIdPayload.Type

export const createVerificationId = ({
  phoneNumber,
  verificationId,
}: VerificationIdPayload): Effect.Effect<
  EraseUserVerificationId,
  Config.ConfigError | SchemaError | CryptoError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const crypto = yield* ServerCrypto

    const dataToEncrypt = {
      phoneNumber,
      verificationId,
      expiresAt: unixMillisecondsFromNow(VERIFICATION_EXPIRES_AFTER_MILIS),
    }

    return yield* pipe(
      crypto.encryptAES(VerificationIdPayload)(dataToEncrypt),
      Effect.flatMap(Schema.decodeEffect(EraseUserVerificationId))
    )
  })

export const validateAndDecodeVerificationId = (
  verificationId: EraseUserVerificationId
): Effect.Effect<
  VerificationIdPayload,
  InvalidVerificationIdError | Config.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const crypto = yield* ServerCrypto
    const decrypted = yield* pipe(
      Schema.decodeEffect(AesGtmCypher)(verificationId),
      Effect.flatMap(crypto.decryptAES(VerificationIdPayload)),
      Effect.catchTags({
        CryptoError: () =>
          new InvalidVerificationIdError({
            status: 400,
            reason: 'InvalidCypher',
          }),
        SchemaError: () =>
          new InvalidVerificationIdError({
            status: 400,
            reason: 'InvalidFormat',
          }),
      })
    )

    if (unixMillisecondsFromNow(0) > decrypted.expiresAt) {
      return yield* new InvalidVerificationIdError({
        status: 400,
        reason: 'Expired',
      })
    }
    return decrypted
  })

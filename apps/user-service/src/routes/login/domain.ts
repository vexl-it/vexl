import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  PhoneNumberVerificationId,
  VerificationChallenge,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Schema} from 'effect'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'

export const ChallengeVerificationState = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  countryPrefix: CountryPrefix,
  phoneNumber: HashedPhoneNumber,
  expiresAt: UnixMilliseconds,
  challenge: VerificationChallenge,
})

export type ChallengeVerificationState = typeof ChallengeVerificationState.Type

export const PhoneVerificationState = Schema.Union(
  Schema.Struct({
    id: PhoneNumberVerificationId,
    type: Schema.Literal('twilioSmsVerification'),
    sid: SmsVerificationSid,
    phoneNumber: HashedPhoneNumber,
    countryPrefix: CountryPrefix,
    expiresAt: UnixMilliseconds,
  }),
  Schema.Struct({
    id: PhoneNumberVerificationId,
    type: Schema.Literal('staticCodeVerification'),
    code: Schema.String,
    phoneNumber: HashedPhoneNumber,
    countryPrefix: CountryPrefix,
    expiresAt: UnixMilliseconds,
  })
)

export type PhoneVerificationState = typeof PhoneVerificationState.Type

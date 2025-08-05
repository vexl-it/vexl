import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  PhoneNumberVerificationId,
  VerificationChallenge,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Schema} from 'effect'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'

export const ChallengeVerificationState = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  countryPrefix: CountryPrefixE,
  phoneNumber: HashedPhoneNumberE,
  expiresAt: UnixMillisecondsE,
  challenge: VerificationChallenge,
})

export type ChallengeVerificationState = typeof ChallengeVerificationState.Type

export const PhoneVerificationState = Schema.Union(
  Schema.Struct({
    id: PhoneNumberVerificationId,
    type: Schema.Literal('twilioSmsVerification'),
    sid: SmsVerificationSid,
    phoneNumber: HashedPhoneNumberE,
    countryPrefix: CountryPrefixE,
    expiresAt: UnixMillisecondsE,
  }),
  Schema.Struct({
    id: PhoneNumberVerificationId,
    type: Schema.Literal('staticCodeVerification'),
    code: Schema.String,
    phoneNumber: HashedPhoneNumberE,
    countryPrefix: CountryPrefixE,
    expiresAt: UnixMillisecondsE,
  })
)

export type PhoneVerificationState = typeof PhoneVerificationState.Type

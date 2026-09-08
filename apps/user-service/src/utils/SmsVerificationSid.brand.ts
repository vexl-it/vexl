import {Schema} from 'effect'

export const SmsVerificationSid = Schema.String.pipe(
  Schema.brand('SmsVerificationSid')
)
export type SmsVerificationSid = typeof SmsVerificationSid.Type
export const decodeSmsVerificationSid = Schema.decodeEffect(SmsVerificationSid)

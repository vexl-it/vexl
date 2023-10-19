import z from 'zod'
import {type AxiosResponse} from 'axios'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

export interface InvalidPhoneNumber {
  _tag: 'InvalidPhoneNumber'
}

export interface PreviousCodeNotExpired {
  _tag: 'PreviousCodeNotExpired'
}

export interface UserAlreadyExists {
  _tag: 'UserAlreadyExists'
}

export interface ChallengeCouldNotBeGenerated {
  _tag: 'ChallengeCouldNotBeGenerated'
}

export interface VerificationNotFound {
  _tag: 'VerificationNotFound'
}

export interface UserNotFound {
  _tag: 'UserNotFound'
}

export interface SignatureCouldNotBeGenerated {
  _tag: 'SignatureCouldNotBeGenerated'
}

export interface PublicKeyOrHashInvalid {
  _tag: 'PublicKeyOrHashInvalid'
}

export interface RequestCouldNotBeProcessedError {
  _tag: 'RequestCouldNotBeProcessedError'
}

export interface InitPhoneNumberVerificationRequest {
  phoneNumber: E164PhoneNumber
}

export const VerificationId = z.number().int().min(0).brand<'VerificationId'>()
export type VerificationId = z.TypeOf<typeof VerificationId>

export const InitPhoneNumberVerificationResponse = z.object({
  verificationId: VerificationId,
  expirationAt: IsoDatetimeString,
})

export type InitPhoneNumberVerificationResponse = z.TypeOf<
  typeof InitPhoneNumberVerificationResponse
>

export const VerifyPhoneNumberRequest = z.object({
  id: VerificationId,
  code: z.string().nonempty(),
  // TODO branded type for keys
  userPublicKey: PublicKeyPemBase64,
})
export type VerifyPhoneNumberRequest = z.TypeOf<typeof VerifyPhoneNumberRequest>

export const VerifyPhoneNumberResponse = z.object({
  challenge: z.string().nonempty(),
  phoneVerified: z.boolean(),
})
export type VerifyPhoneNumberResponse = z.TypeOf<
  typeof VerifyPhoneNumberResponse
>

export const VerifyChallengeRequest = z.object({
  userPublicKey: PublicKeyPemBase64,
  signature: z.string().nonempty(),
})
export type VerifyChallengeRequest = z.TypeOf<typeof VerifyChallengeRequest>

export const VerifyChallengeResponse = z.object({
  hash: z.string().nonempty(),
  signature: z.string().nonempty(),
  challengeVerified: z.boolean(),
})
export type VerifyChallengeResponse = z.TypeOf<typeof VerifyChallengeResponse>

export const ExportDataResponse = z.object({
  pdfFile: z.string().nonempty(),
})
export type ExportDataResponse = z.TypeOf<typeof ExportDataResponse>

export interface InvalidPhoneNumberResponse {
  _tag: 'InvalidPhoneNumberResponse'
  response: AxiosResponse
}

export const GetCryptocurrencyDetailsRequest = z.object({
  coin: z.literal('bitcoin').default('bitcoin'),
})
export type GetCryptocurrencyDetailsRequest = z.TypeOf<
  typeof GetCryptocurrencyDetailsRequest
>

export const GetCryptocurrencyDetailsResponse = z.object({
  priceUsd: z.number(),
  priceCzk: z.number(),
  priceEur: z.number(),
  priceChangePercentage24h: z.number(),
  priceChangePercentage7d: z.number(),
  priceChangePercentage14d: z.number(),
  priceChangePercentage30d: z.number(),
  priceChangePercentage60d: z.number(),
  priceChangePercentage200d: z.number(),
  priceChangePercentage1y: z.number(),
  lastUpdated: IsoDatetimeString,
})
export type GetCryptocurrencyDetailsResponse = z.TypeOf<
  typeof GetCryptocurrencyDetailsResponse
>

export const SubmitFeedbackRequest = z.object({
  formId: z.string().nonempty(),
  type: z.string().nonempty(),
  stars: z.number().optional(),
  objections: z.string().optional(),
  textComment: z.string().optional(),
})

export type SubmitFeedbackRequest = z.TypeOf<typeof SubmitFeedbackRequest>

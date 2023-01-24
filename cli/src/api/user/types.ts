export interface InitPhoneNumberVerificationRequest {
    phoneNumber: string
}

export interface InitPhoneNumberVerificationResponse {
    verificationId: number
    expirationAt: string
}

export interface VerifyPhoneNumberRequest {
    id: number,
    code: string,
    userPublicKey: string
}

export interface VerifyPhoneNumberResponse {
    challenge: string,
    phoneVerified: boolean
}

export interface VerifyChallengeRequest {
    userPublicKey: string,
    signature: string
}

export interface VerifyChallengeResponse {
    hash: string
    signature: string
    challengeVerified: boolean
}

export interface ExportDataResponse {
    pdfFile: string
}

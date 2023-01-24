import Axios, {AxiosPromise} from "axios";
import {HEADER_CRYPTO_VERSION} from "../commonTypes";
import {getCredentialsHeaders} from "../credentialsSession";
import createAxiosInstanceWithAuth from "../createAuthInstance";
import {
    ExportDataResponse,
    InitPhoneNumberVerificationRequest,
    InitPhoneNumberVerificationResponse,
    VerifyChallengeRequest,
    VerifyChallengeResponse,
    VerifyPhoneNumberRequest,
    VerifyPhoneNumberResponse
} from "./types";

const USER_API_URL = process.env.USER_API_BASE_URL;

const axiosInstance = Axios.create({
    baseURL: USER_API_URL,
    headers: {
        [HEADER_CRYPTO_VERSION]: '2'
    }
})

const authAxiosInstance = createAxiosInstanceWithAuth({baseURL: USER_API_URL})


export function initPhoneVerification(request: InitPhoneNumberVerificationRequest): AxiosPromise<InitPhoneNumberVerificationResponse> {
    return axiosInstance.post('/user/confirmation/phone', request)
}

export function verifyPhoneNumber(request: VerifyPhoneNumberRequest): AxiosPromise<VerifyPhoneNumberResponse> {
    return axiosInstance.post('/user/confirmation/code', request);
}

export function verifyChallenge(request: VerifyChallengeRequest): AxiosPromise<VerifyChallengeResponse> {
    return axiosInstance.post('/user/confirmation/challenge', request);
}

export function deleteUser(): AxiosPromise<void> {
    return axiosInstance.delete('/user/me', {
        headers: getCredentialsHeaders()
    })
}

export function exportData(): AxiosPromise<ExportDataResponse> {
    return authAxiosInstance.get('/export/me', {
        headers: getCredentialsHeaders()
    })
}

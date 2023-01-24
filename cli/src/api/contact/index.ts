import createAxiosInstanceWithAuth from "../createAuthInstance";
import {RegisterUserRequest} from "./types";
import {AxiosPromise} from "axios";

const authAxiosInstance = createAxiosInstanceWithAuth({baseURL: process.env.CONTACT_API_BASE_URL})


export function registerUser(request: RegisterUserRequest): AxiosPromise<void> {
    return authAxiosInstance.post('/users', request)
}

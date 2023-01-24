import Axios, {AxiosInstance} from 'axios'
import {HEADER_CRYPTO_VERSION, HEADER_PLATFORM} from "./commonTypes";
import {getCredentialsHeaders} from "./credentialsSession";

export default function createAxiosInstanceWithAuth({baseURL}: { baseURL: string }): AxiosInstance {
    const axiosInstance = Axios.create({
        baseURL,
        headers: {
            [HEADER_CRYPTO_VERSION]: '2',
            [HEADER_PLATFORM]: 'cli'
        },
    })

    axiosInstance.interceptors.request.use((config) => {
        config.headers = {...config.headers, ...getCredentialsHeaders()}
        return config
    })

    return axiosInstance
}

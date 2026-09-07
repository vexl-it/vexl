import {api} from '@vexl-next/rest-api/src/services/user'
import {Effect} from 'effect'
import {FetchHttpClient} from 'effect/unstable/http'
import {apiMeta, getEnvPreset, userSessionCredentials} from './apiCommon'

export async function createUserPublicApi() {
  return await api({
    url: getEnvPreset().userMs,
    ...apiMeta,
    deviceModel: 'web',
    osVersion: 'web',
    getUserSessionCredentials: () => userSessionCredentials,
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise)
}

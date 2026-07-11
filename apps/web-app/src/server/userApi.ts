import {FetchHttpClient} from '@effect/platform'
import {api} from '@vexl-next/rest-api/src/services/user'
import {Effect} from 'effect'
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

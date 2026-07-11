import {FetchHttpClient} from '@effect/platform'
import {api} from '@vexl-next/rest-api/src/services/contact'
import {Effect} from 'effect'
import {apiMeta, getEnvPreset, userSessionCredentials} from './apiCommon'

export async function createContactsPublicApi() {
  return await api({
    url: getEnvPreset().contactMs,
    ...apiMeta,
    deviceModel: 'web',
    osVersion: 'web',
    getUserSessionCredentials: () => userSessionCredentials,
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise)
}

import {atom, getDefaultStore, useAtomValue} from 'jotai'
import {user, ENV_PRESETS, PlatformName, contact} from '@vexl-next/rest-api'
import {Platform} from 'react-native'
import {sessionHolderAtom} from '../state/session'
import reportError from '../utils/reportError'
// import {ServiceUrl} from '@vexl-next/rest-api/dist/ServiceUrl.brand'

export const platform = PlatformName.parse(
  Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
)
export const apiEnv = ENV_PRESETS.stageEnv
// export const apiEnv = {
//   userMs: ServiceUrl.parse('http://localhost:8000'),
//   contactMs: ServiceUrl.parse('http://localhost:8003'),
//   offerMs: ServiceUrl.parse('http://localhost:8002'),
//   chatMs: ServiceUrl.parse('http://localhost:8001'),
// }

const _publicApiAtom = atom({
  user: user.publicApi({
    url: apiEnv.userMs,
    platform,
  }),
})

export const publicApiAtom = atom((get) => get(_publicApiAtom))

export function useUserPublicApi(): ReturnType<typeof user.publicApi> {
  return useAtomValue(publicApiAtom).user
}

export function usePrivateApiAssumeLoggedIn(): {
  contact: ReturnType<typeof contact.privateApi>
} {
  return {
    contact: contact.privateApi({
      platform,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => {
        const session = getDefaultStore().get(sessionHolderAtom)
        if (session.state !== 'loggedIn') {
          reportError('error', 'User is not in session.', {session})
          throw new Error('User is not logged in')
        }
        return session.session.sessionCredentials
      },
    }),
  }
}

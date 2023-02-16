import {atom, useAtomValue} from 'jotai'
import {user, ENV_PRESETS} from '@vexl-next/rest-api'
// import {ServiceUrl} from '@vexl-next/rest-api/dist/ServiceUrl.brand'

const _publicApiAtom = atom({
  user: user.publicApi({url: ENV_PRESETS.stageEnv.userMs}),
  // user: user.publicApi({url: ServiceUrl.parse('http://localhost:8000')}),
})

export const publicApiAtom = atom((get) => get(_publicApiAtom))

export function useUserPublicApi(): ReturnType<typeof user.publicApi> {
  return useAtomValue(publicApiAtom).user
}

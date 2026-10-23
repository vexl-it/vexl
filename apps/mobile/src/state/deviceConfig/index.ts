import {DeviceConfigResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ignoreReportErrors} from '../../utils/reportError'

const deviceConfigAtom = atomWithParsedMmkvStorage(
  'deviceConfig',
  {trustedFriends: false},
  DeviceConfigResponse
)

export const trustedFriendsEnabledAtom = focusAtom(deviceConfigAtom, (o) =>
  o.prop('trustedFriends')
)

export const loadDeviceConfigActionAtom = atom(null, (get, set) =>
  get(apiAtom)
    .content.getDeviceConfig()
    .pipe(
      Effect.tap((config) =>
        Effect.sync(() => {
          set(deviceConfigAtom, config)
        })
      ),
      ignoreReportErrors('warn', 'Error loading device config')
    )
)

import {atom} from 'jotai'
import {
  VERSION_SERVICE_STATE_DEFAULT_VALUE,
  type VersionServiceState,
} from './domain'

export const versionServiceAtom = atom<VersionServiceState>(
  VERSION_SERVICE_STATE_DEFAULT_VALUE
)

export const offerRerequestLimitDaysAtom = atom((get) => {
  return get(versionServiceAtom).offerRerequestLimitDays
})

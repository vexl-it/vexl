import {atom} from 'jotai'
import {preferencesAtom} from '../preferences'
import {
  VERSION_SERVICE_STATE_DEFAULT_VALUE,
  type VersionServiceState,
} from './domain'

export const versionServiceAtom = atom<VersionServiceState>(
  VERSION_SERVICE_STATE_DEFAULT_VALUE
)

export const offerRerequestLimitDaysAtom = atom((get) => {
  const disableRerequestLimit = get(preferencesAtom).disableOfferRerequestLimit

  return disableRerequestLimit
    ? 0
    : get(versionServiceAtom).offerRerequestLimitDays
})

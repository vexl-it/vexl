import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {versionCode} from '../../utils/environment'
import {remoteConfigAtom} from '../../utils/remoteConfig/atoms'

export const shouldDisplayForceUpdateScreenAtom = atom((get) => {
  return versionCode <= get(remoteConfigAtom).next__force_update
})

export const shouldDisplayMaintenanceScreenAtom = atom((get) => {
  const {from, to} = get(remoteConfigAtom).next__maintenance

  const fromDate = DateTime.fromISO(from)
  const toDate = DateTime.fromISO(to)
  if (!fromDate.isValid || !toDate.isValid) {
    return false
  }

  const now = DateTime.local()
  return now > fromDate && now < toDate
})

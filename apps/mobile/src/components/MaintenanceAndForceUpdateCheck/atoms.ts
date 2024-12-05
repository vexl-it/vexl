import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {versionServiceAtom} from '../../utils/versionService/atoms'

export const shouldDisplayForceUpdateScreenAtom = atom((get) => {
  return get(versionServiceAtom).requestForceUpdate
})

export const shouldDisplayMaintenanceScreenAtom = atom((get) => {
  const {maintenanceUntil} = get(versionServiceAtom)

  if (!maintenanceUntil) {
    return false
  }

  const fromDate = DateTime.fromMillis(maintenanceUntil.start)
  const toDate = DateTime.fromMillis(maintenanceUntil.end)
  if (!fromDate.isValid || !toDate.isValid) {
    return false
  }

  const now = DateTime.local()
  return now > fromDate && now < toDate
})

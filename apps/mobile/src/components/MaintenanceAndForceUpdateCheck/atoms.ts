import {atom} from 'jotai'
import {
  DEFAULT_REMOTE_CONFIG,
  MaintenanceConfig,
  type RemoteConfig,
} from './domain'
import remoteConfig from '@react-native-firebase/remote-config'
import {pipe} from 'fp-ts/function'
import {parseJson, safeParse} from '../../utils/fpUtils'
import * as E from 'fp-ts/Either'
import reportError from '../../utils/reportError'
import {AppState} from 'react-native'
import {versionCode} from '../../utils/environment'
import {DateTime} from 'luxon'

export const remoteConfigAtom = atom<RemoteConfig>(DEFAULT_REMOTE_CONFIG)

remoteConfigAtom.onMount = (set) => {
  // Be aware that this does not refetch the remote config. It just updates the atom.
  // Refetching happens automatically every 12 hours or so.
  function refreshConfig(): void {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const next__force_update = remoteConfig().getNumber('next__force_update')
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const next__maintenance = pipe(
      remoteConfig().getString('next__maintenance'),
      parseJson,
      E.chainW(safeParse(MaintenanceConfig)),
      E.match(
        (e) => {
          reportError(
            'error',
            'Error while reading next__maintenance from remote config',
            e
          )
          return DEFAULT_REMOTE_CONFIG.next__maintenance
        },
        (v) => v
      )
    )

    set((prev) => ({
      next__force_update,
      // Update only if the value has changed. This is to prevent unnecessary
      // re-renders.
      next__maintenance:
        `${prev.next__maintenance.from}${prev.next__maintenance.to}` ===
        `${next__maintenance.from}${next__maintenance.to}`
          ? prev.next__maintenance
          : next__maintenance,
    }))
  }

  refreshConfig()
  return AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      refreshConfig()
    }
  }).remove
}

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

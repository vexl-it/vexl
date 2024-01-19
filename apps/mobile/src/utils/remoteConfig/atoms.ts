import remoteConfig from '@react-native-firebase/remote-config'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {AppState} from 'react-native'
import {parseJson, safeParse} from '../fpUtils'
import {preferencesAtom} from '../preferences'
import reportError from '../reportError'
import {
  DEFAULT_REMOTE_CONFIG,
  MaintenanceConfig,
  NextForceUpdate,
  OfferRerequestLimitDays,
  type RemoteConfig,
} from './domain'

export const remoteConfigAtom = atom<RemoteConfig>(DEFAULT_REMOTE_CONFIG)

remoteConfigAtom.onMount = (set) => {
  // Be aware that this does not refetch the remote config. It just updates the atom.
  // Refetching happens automatically every 12 hours or so.
  function refreshConfig(): void {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const next__force_update = pipe(
      remoteConfig().getNumber('next__force_update'),
      safeParse(NextForceUpdate),
      E.getOrElse((e) => {
        reportError(
          'warn',
          'Error while reading next__force_update from remote config',
          e
        )
        return DEFAULT_REMOTE_CONFIG.next__force_update
      })
    )

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const next__maintenance = pipe(
      remoteConfig().getString('next__maintenance'),
      parseJson,
      E.chainW(safeParse(MaintenanceConfig)),
      E.getOrElse((e) => {
        reportError(
          'warn',
          'Error while reading next__maintenance from remote config',
          e
        )
        return DEFAULT_REMOTE_CONFIG.next__maintenance
      })
    )

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const next__offer_rerequest_limit_days = pipe(
      remoteConfig().getString('next__offer_rerequest_limit_days'),
      parseJson,
      E.chainW(safeParse(OfferRerequestLimitDays)),
      E.getOrElse((e) => {
        reportError(
          'warn',
          'Error while reading next__offer_rerequest_limit_days from remote config',
          e
        )
        return DEFAULT_REMOTE_CONFIG.next__offer_rerequest_limit_days
      })
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
      next__offer_rerequest_limit_days,
    }))
  }

  refreshConfig()
  return AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      refreshConfig()
    }
  }).remove
}

export const offerRerequestLimitDaysAtom = atom((get) => {
  if (get(preferencesAtom).disableOfferRerequestLimit)
    return OfferRerequestLimitDays.parse(0)

  return get(remoteConfigAtom).next__offer_rerequest_limit_days
})

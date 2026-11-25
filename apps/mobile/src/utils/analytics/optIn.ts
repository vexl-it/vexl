import {atom, type SetStateAction} from 'jotai'
import getValueFromSetStateActionOfAtom from '../atomUtils/getValueFromSetStateActionOfAtom'
import {preferencesAtom} from '../preferences'
import {analyticsEnabledAtom, resetAnalyticsStateActionAtom} from './atoms'
import {fetchedRelaysAtom} from './relayConfig'

export const analyticsBlogPostUrl = 'https://vexl.it/'

/** The opt-in choice, off until answered. Opting out wipes everything recorded so far. */
export const analyticsOptInAtom = atom(
  (get) => get(analyticsEnabledAtom),
  (get, set, update: SetStateAction<boolean>) => {
    const enabled = getValueFromSetStateActionOfAtom(update)(() =>
      get(analyticsEnabledAtom)
    )
    set(preferencesAtom, (old) => ({
      ...old,
      analyticsConsent: enabled ? 'granted' : 'denied',
    }))
    // A deferred write lost to an app kill would silently undo an opt-out.
    preferencesAtom.flushNow()
    if (!enabled) {
      set(resetAnalyticsStateActionAtom)
      set(fetchedRelaysAtom, {})
      fetchedRelaysAtom.flushNow()
    }
  }
)

import {atom, type SetStateAction} from 'jotai'
import getValueFromSetStateActionOfAtom from '../atomUtils/getValueFromSetStateActionOfAtom'
import {preferencesAtom} from '../preferences'
import {analyticsEnabledAtom, resetAnalyticsStateActionAtom} from './atoms'
import {fetchedRelaysAtom} from './relayConfig'

/** The opt-in toggle, off by default. Opting out wipes everything recorded so far. */
export const analyticsOptInAtom = atom(
  (get) => get(analyticsEnabledAtom),
  (get, set, update: SetStateAction<boolean>) => {
    const enabled = getValueFromSetStateActionOfAtom(update)(() =>
      get(analyticsEnabledAtom)
    )
    set(preferencesAtom, (old) => ({...old, analyticsEnabled: enabled}))
    // A deferred write lost to an app kill would silently undo an opt-out.
    preferencesAtom.flushNow()
    if (!enabled) {
      set(resetAnalyticsStateActionAtom)
      set(fetchedRelaysAtom, {})
      fetchedRelaysAtom.flushNow()
    }
  }
)

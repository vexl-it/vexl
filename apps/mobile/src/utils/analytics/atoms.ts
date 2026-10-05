import {atom, type SetStateAction} from 'jotai'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../atomUtils/atomWithParsedMmkvStorage'
import getValueFromSetStateActionOfAtom from '../atomUtils/getValueFromSetStateActionOfAtom'
import {preferencesAtom} from '../preferences'
import {AnalyticsInstances, AnalyticsMarkers} from './domain'

const markersStorage = atomWithParsedMmkvStorageWithImmediateSaveOption(
  'analyticsMarkers',
  {},
  AnalyticsMarkers
)
export const analyticsMarkersAtom = markersStorage.atom
export const setAnalyticsMarkersAtom = markersStorage.setAndSaveImmediatelyAtom

const instancesStorage = atomWithParsedMmkvStorageWithImmediateSaveOption(
  'analyticsInstances',
  {},
  AnalyticsInstances
)
export const analyticsInstancesAtom = instancesStorage.atom
export const setAnalyticsInstancesAtom =
  instancesStorage.setAndSaveImmediatelyAtom

export const resetAnalyticsStateActionAtom = atom(null, (get, set) => {
  set(setAnalyticsMarkersAtom, {})
  set(setAnalyticsInstancesAtom, {})
})

/** Opt-out toggle. Turning it off wipes everything recorded so far. */
export const analyticsEnabledAtom = atom(
  (get) => get(preferencesAtom).analyticsEnabled,
  (get, set, update: SetStateAction<boolean>) => {
    const enabled = getValueFromSetStateActionOfAtom(update)(
      () => get(preferencesAtom).analyticsEnabled
    )
    set(preferencesAtom, (old) => ({...old, analyticsEnabled: enabled}))
    if (!enabled) set(resetAnalyticsStateActionAtom)
  }
)

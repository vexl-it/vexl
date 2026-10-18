import {atom} from 'jotai'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../atomUtils/atomWithParsedMmkvStorage'
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

export const analyticsEnabledAtom = atom(
  (get) => get(preferencesAtom).analyticsEnabled
)

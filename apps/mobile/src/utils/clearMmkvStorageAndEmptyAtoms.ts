import {getDefaultStore} from 'jotai'
import {
  analyticsInstancesAtom,
  analyticsMarkersAtom,
  setAnalyticsInstancesAtom,
  setAnalyticsMarkersAtom,
} from './analytics/atoms'
import {
  beginMmkvStorageClear,
  CLEAR_STORAGE_KEY,
} from './atomUtils/atomWithParsedMmkvStorage'
import {storage} from './mmkv/effectMmkv'
import {clearMmkvDataLossDiagnostics} from './mmkv/mmkvDataLossDiagnosticStorage'

export default async function clearMmkvStorageAndEmptyAtoms({
  keepAnalytics = false,
}: {
  /** Pre-login clears keep the onboarding journey and its markers. */
  keepAnalytics?: boolean
} = {}): Promise<void> {
  const store = getDefaultStore()
  const analytics = {
    markers: store.get(analyticsMarkersAtom),
    instances: store.get(analyticsInstancesAtom),
  }

  // set all atoms to defaultValue
  storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())

  const finishStorageClear = beginMmkvStorageClear()

  try {
    // The analytics atoms are never mounted, so the clear marker above does not
    // reach them. Storage writes are suppressed while the clear is active, so
    // this only resets the in-memory values.
    store.set(setAnalyticsMarkersAtom, {})
    store.set(setAnalyticsInstancesAtom, {})
    await clearMmkvDataLossDiagnostics(() => {
      storage._storage.clearAll()
    })
  } finally {
    finishStorageClear()
  }

  if (!keepAnalytics) return
  store.set(setAnalyticsMarkersAtom, analytics.markers)
  store.set(setAnalyticsInstancesAtom, analytics.instances)
}

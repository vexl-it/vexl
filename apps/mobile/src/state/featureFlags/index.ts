import {FeatureFlagsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ignoreReportErrors} from '../../utils/reportError'

const featureFlagsAtom = atomWithParsedMmkvStorage(
  'featureFlags',
  {trustedFriends: false},
  FeatureFlagsResponse
)

export const trustedFriendsEnabledAtom = focusAtom(featureFlagsAtom, (o) =>
  o.prop('trustedFriends')
)

export const loadFeatureFlagsActionAtom = atom(null, (get, set) =>
  get(apiAtom)
    .content.getFeatureFlags()
    .pipe(
      Effect.tap((flags) =>
        Effect.sync(() => {
          set(featureFlagsAtom, flags)
        })
      ),
      ignoreReportErrors('warn', 'Error loading feature flags')
    )
)

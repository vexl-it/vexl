import {generateUuid, Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type MetricsApi} from '@vexl-next/rest-api/src/services/metrics'
import {type FrontendEvent} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {reportErrorE} from '../../utils/reportError'

export const ANALYTICS_STATE_STORAGE_KEY = 'analyticsState'

const AnalyticsState = Schema.Struct({
  analyticsUuid: Schema.NullOr(Uuid),
  appStartedFirstTimeReported: Schema.Boolean,
})

const defaultAnalyticsState: typeof AnalyticsState.Type = {
  analyticsUuid: null,
  appStartedFirstTimeReported: false,
}

export const analyticsStateAtom = atomWithParsedMmkvStorage(
  ANALYTICS_STATE_STORAGE_KEY,
  defaultAnalyticsState,
  AnalyticsState
)

function reportFrontendEvent({
  api,
  analyticsUuid,
  event,
}: {
  api: MetricsApi
  analyticsUuid: Uuid
  event: FrontendEvent
}): Effect.Effect<void> {
  return api
    .reportFrontendEvent({
      analyticsUuid,
      event,
    })
    .pipe(
      Effect.tapError((e) =>
        reportErrorE(
          'warn',
          new Error('Error while reporting frontend event', {cause: e})
        )
      ),
      Effect.ignore
    )
}

export const ensureAnalyticsUuidAndReportFirstStartActionAtom = atom(
  null,
  (get, set): Uuid => {
    const state = get(analyticsStateAtom)
    const analyticsUuid = state.analyticsUuid ?? generateUuid()

    if (!state.analyticsUuid || !state.appStartedFirstTimeReported) {
      set(analyticsStateAtom, {
        analyticsUuid,
        appStartedFirstTimeReported: true,
      })

      Effect.runFork(
        reportFrontendEvent({
          api: get(apiAtom).metrics,
          analyticsUuid,
          event: 'appStartedFirstTime',
        })
      )
    }

    return analyticsUuid
  }
)

export const reportFrontendEventActionAtom = atom(
  null,
  (get, set, event: FrontendEvent): void => {
    const analyticsUuid = set(ensureAnalyticsUuidAndReportFirstStartActionAtom)

    if (event === 'appStartedFirstTime') return

    Effect.runFork(
      reportFrontendEvent({
        api: get(apiAtom).metrics,
        analyticsUuid,
        event,
      })
    )
  }
)

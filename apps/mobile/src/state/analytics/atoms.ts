import {generateUuid, Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type MetricsApi} from '@vexl-next/rest-api/src/services/metrics'
import {
  type FrontendEvent,
  type FrontendEventAttributes,
} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {reportErrorE} from '../../utils/reportError'

export const ANALYTICS_STATE_STORAGE_KEY = 'analyticsState'
const SESSION_STARTED_THROTTLE_MS = 10 * 60 * 1000
const EVENT_DATE_JITTER_MS = 30 * 60 * 1000

const AnalyticsState = Schema.Struct({
  analyticsUuid: Schema.NullOr(Uuid),
  appStartedFirstTimeReported: Schema.Boolean,
  lastSessionStartedAt: Schema.optionalWith(Schema.Number, {
    default: () => 0,
  }),
})

const defaultAnalyticsState: typeof AnalyticsState.Type = {
  analyticsUuid: null,
  appStartedFirstTimeReported: false,
  lastSessionStartedAt: 0,
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
  attributes,
}: {
  api: MetricsApi
  analyticsUuid: Uuid
  event: FrontendEvent
  attributes?: FrontendEventAttributes | undefined
}): Effect.Effect<void> {
  return api
    .reportFrontendEvent({
      id: generateUuid(),
      analyticsId: analyticsUuid,
      event,
      attributes,
      date: eventDateWithJitter(new Date()),
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

export function eventDateWithJitter(now: Date): Date {
  const jitterMs = Math.floor(Math.random() * (EVENT_DATE_JITTER_MS * 2 + 1))
  return new Date(now.getTime() + jitterMs - EVENT_DATE_JITTER_MS)
}

export const ensureAnalyticsUuidAndReportFirstStartActionAtom = atom(
  null,
  (get, set): Uuid => {
    const state = get(analyticsStateAtom)
    const analyticsUuid = state.analyticsUuid ?? generateUuid()

    if (!state.analyticsUuid || !state.appStartedFirstTimeReported) {
      set(analyticsStateAtom, {
        ...state,
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
  (
    get,
    set,
    event: FrontendEvent,
    attributes?: FrontendEventAttributes
  ): void => {
    const analyticsUuid = set(ensureAnalyticsUuidAndReportFirstStartActionAtom)

    if (event === 'appStartedFirstTime') return

    Effect.runFork(
      reportFrontendEvent({
        api: get(apiAtom).metrics,
        analyticsUuid,
        event,
        attributes,
      })
    )
  }
)

export const reportAppOpenedActionAtom = atom(null, (get, set): void => {
  const now = Date.now()

  set(reportFrontendEventActionAtom, 'appOpened')

  const state = get(analyticsStateAtom)
  if (now - state.lastSessionStartedAt < SESSION_STARTED_THROTTLE_MS) return

  set(analyticsStateAtom, {
    ...state,
    lastSessionStartedAt: now,
  })
  set(reportFrontendEventActionAtom, 'sessionStarted')
})

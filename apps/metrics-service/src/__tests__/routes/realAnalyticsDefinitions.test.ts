import {
  bucketStartDay,
  dayOf,
  updatedDayFor,
} from '@vexl-next/analytics-definitions/src/buckets'
import type * as Definitions from '@vexl-next/analytics-definitions/src/definitions'
import {MAX_RELAYED_ANALYTICS_STATE_BYTES} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {Effect, Option, Record} from 'effect'
import {
  clearStoredStates,
  iosClientWithPrefix,
  newStateId,
  readStoredStates,
  upsertState,
} from '../utils/analyticsStates'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

// The registry is mocked with the test definitions added (jest.afterenv.ts).
const realDefinitions = jest.requireActual<typeof Definitions>(
  '@vexl-next/analytics-definitions/src/definitions'
).analyticsDefinitions

const coreActivity = {coreActionMain: true, coreActionClub: true}

// Every field set, so the uploads are as large as the definitions allow.
const fullPayloads: Record<string, object> = {
  onboarding: {
    step: 'registered',
    existingAccount: false,
    registeredAfter: 'd2To7',
    contactsImport: 'completed',
    firstMarketplaceLoad: '21to50',
    offerOpened: true,
    activation: 'request',
    activatedAfter: 'd8Plus',
    clubJoin: 'beforeContactsImport',
    clubActivation: 'request',
    coreActionD1: true,
    coreActionD7: true,
    coreActionD30: true,
  },
  offer: {
    offerType: 'sell',
    class: 'mainAndClub',
    firstRequestAfter: '1dTo7d',
    requestsReceived: '2to5',
    firstAnswerAfter: 'under1h',
    removed: true,
  },
  request: {
    class: 'club',
    outcome: 'cancelled',
    answerAfter: 'over7d',
    bothWrote: true,
  },
  reactivation: {
    dormantFor: 'd61To180',
    openedFrom: 'inactivityReminder',
    firstAction: 'requestSent',
    coreAction: true,
    clubMember: true,
  },
  notificationOpen: {
    category: 'clubDeactivated',
    offerOpened: true,
    offerCreated: true,
    requestSent: true,
    chatOpened: true,
  },
  prompt: {
    promptId: 'missingProductCategories',
    outcome: 'dismissed',
    targetReached: true,
  },
  activityDaily: coreActivity,
  activityWeekly: {
    tenure: 'w14plus',
    ...coreActivity,
    activeDays: 7,
    offersCreated: 20,
    requestsSent: 50,
    requestsApproved: 50,
    offersOpened: 200,
    offersVisible: '51plus',
    notificationsAllowed: true,
    clubs: '3plus',
  },
  activityMonthly: coreActivity,
}

describe('relayAnalyticsState with the registered definitions', () => {
  it.each(Record.keys(realDefinitions))(
    'stores a valid %s state',
    async (name) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          yield* _(clearStoredStates)
          const definition = realDefinitions[name]
          const payload = Option.getOrThrow(Record.get(fullPayloads, name))
          const now = new Date()
          const startDay =
            definition.kind === 'aggregation'
              ? bucketStartDay(definition.period, now)
              : dayOf(now)
          const updatedDay =
            definition.kind === 'journey'
              ? updatedDayFor(definition.updatedDayPrecision, startDay, now)
              : dayOf(now)
          const state = {
            id: newStateId(),
            kind: definition.kind,
            name,
            schemaVersion: definition.schemaVersion,
            revision: 1,
            startDay,
            updatedDay,
            payload,
          }

          expect(
            JSON.stringify({client: iosClientWithPrefix, state}).length
          ).toBeLessThan(MAX_RELAYED_ANALYTICS_STATE_BYTES)

          yield* _(upsertState(state))

          expect(yield* _(readStoredStates)).toMatchObject([
            {
              id: state.id,
              kind: definition.kind,
              name,
              startDay,
              updatedDay,
              payload,
              countryPrefix: definition.storeCountry ? '420' : 'none',
            },
          ])
        })
      )
    }
  )
})

import {Effect, Either, Schema} from 'effect'
import {describe, expect, it} from 'vitest'
import {type ActivityDailyState} from './definitions/activityDaily'
import {type ActivityMonthlyState} from './definitions/activityMonthly'
import {type ActivityWeeklyState} from './definitions/activityWeekly'
import {type NotificationOpenState} from './definitions/notificationOpen'
import {type OfferState} from './definitions/offer'
import {type OnboardingState} from './definitions/onboarding'
import {type PromptState} from './definitions/prompt'
import {type ReactivationState} from './definitions/reactivation'
import {type RequestState} from './definitions/request'
import {analyticsDefinitions, decodeAnalyticsPayload} from './registry'

const samplePayloads: Record<string, object> = {
  onboarding: {
    step: 'registered',
    existingAccount: false,
    registeredAfter: 'd0',
    contactsImport: 'completed',
    firstMarketplaceLoad: '6to20',
    offerOpened: true,
    activation: 'offer',
    activatedAfter: 'd2To7',
    clubJoin: 'beforeContactsImport',
    clubActivation: 'request',
    coreActionD1: true,
    coreActionD7: false,
    coreActionD30: true,
  } satisfies OnboardingState,
  offer: {
    offerType: 'sell',
    class: 'mainAndClub',
    firstRequestAfter: '1hTo1d',
    requestsReceived: '2to5',
    firstAnswerAfter: 'under1h',
    removed: false,
  } satisfies OfferState,
  request: {
    class: 'club',
    outcome: 'approved',
    answerAfter: '1dTo7d',
    bothWrote: true,
  } satisfies RequestState,
  reactivation: {
    dormantFor: 'd61To180',
    openedFrom: 'direct',
    firstAction: 'offerOpened',
    coreAction: true,
    clubMember: false,
  } satisfies ReactivationState,
  notificationOpen: {
    category: 'newOffers',
    offerOpened: true,
    offerCreated: false,
    requestSent: true,
    chatOpened: false,
  } satisfies NotificationOpenState,
  prompt: {
    promptId: 'enableNotifications',
    outcome: 'tapped',
    targetReached: true,
  } satisfies PromptState,
  activityDaily: {coreActionMain: true} satisfies ActivityDailyState,
  activityWeekly: {
    tenure: 'w13',
    coreActionMain: true,
    coreActionClub: true,
    activeDays: 7,
    offersCreated: 20,
    requestsSent: 50,
    requestsApproved: 0,
    offersOpened: 200,
    offersVisible: '0',
    notificationsAllowed: true,
    clubs: '3plus',
  } satisfies ActivityWeeklyState,
  activityMonthly: {coreActionClub: true} satisfies ActivityMonthlyState,
}

const definitions = Object.entries(analyticsDefinitions)

const decode = (
  name: string,
  schemaVersion: number,
  payload: unknown
): Either.Either<unknown, {_tag: string}> =>
  Effect.runSync(
    Effect.either(decodeAnalyticsPayload(name, schemaVersion, payload))
  )

const failureTag = (result: Either.Either<unknown, {_tag: string}>): string =>
  Either.isLeft(result) ? result.left._tag : 'success'

describe('analyticsDefinitions', () => {
  it('has a sample payload for every definition', () => {
    expect(Object.keys(analyticsDefinitions).sort()).toEqual(
      Object.keys(samplePayloads).sort()
    )
  })

  it.each(definitions)('%s is keyed by a valid name', (key, definition) => {
    expect(definition.name).toBe(key)
    expect(definition.name.length).toBeLessThanOrEqual(64)
  })

  it.each(definitions)('%s decodes its sample payload', (key, definition) => {
    expect(
      Either.isRight(decode(key, definition.schemaVersion, samplePayloads[key]))
    ).toBe(true)
  })

  it.each(definitions)(
    '%s keeps journeys over 7 days at week precision without counters',
    (key, definition) => {
      if (definition.kind !== 'journey' || definition.lifetimeDays <= 7) return
      expect(definition.updatedDayPrecision).toBe('week')
      for (const field of Object.keys(samplePayloads[key] ?? {})) {
        const withNumber = {...samplePayloads[key], [field]: 0}
        expect(Schema.is(definition.payloadSchema)(withNumber)).toBe(false)
      }
    }
  )
})

describe('decodeAnalyticsPayload', () => {
  it('rejects an unknown definition name', () => {
    expect(failureTag(decode('nope', 1, {}))).toBe(
      'UnknownAnalyticsDefinitionError'
    )
  })

  it('rejects a schema version the server does not know', () => {
    expect(failureTag(decode('prompt', 2, samplePayloads.prompt))).toBe(
      'AnalyticsSchemaVersionMismatchError'
    )
  })

  it('rejects unknown fields', () => {
    expect(
      failureTag(decode('prompt', 1, {...samplePayloads.prompt, extra: 1}))
    ).toBe('ParseError')
  })

  it('rejects a missing required field', () => {
    expect(failureTag(decode('offer', 1, {offerType: 'buy'}))).toBe(
      'ParseError'
    )
  })

  it('rejects counters above the cap', () => {
    expect(
      failureTag(
        decode('activityWeekly', 1, {
          ...samplePayloads.activityWeekly,
          activeDays: 8,
        })
      )
    ).toBe('ParseError')
  })
})

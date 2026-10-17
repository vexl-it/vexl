import {Effect, Either} from 'effect'
import {describe, expect, it} from 'vitest'
import {analyticsDefinitions, decodeAnalyticsPayload} from './registry'

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
  it('keys every definition by its own name', () => {
    for (const [key, definition] of Object.entries(analyticsDefinitions)) {
      expect(definition.name).toBe(key)
    }
  })
})

describe('decodeAnalyticsPayload', () => {
  it('decodes a valid payload', () => {
    const result = decode('onboarding', 1, {step: 'opened', reLogin: false})
    expect(Either.isRight(result)).toBe(true)
  })

  it('rejects an unknown definition name', () => {
    expect(failureTag(decode('nope', 1, {}))).toBe(
      'UnknownAnalyticsDefinitionError'
    )
  })

  it('rejects a schema version the server does not know', () => {
    expect(failureTag(decode('onboarding', 2, {step: 'opened'}))).toBe(
      'AnalyticsSchemaVersionMismatchError'
    )
  })

  it('rejects unknown fields', () => {
    expect(
      failureTag(
        decode('onboarding', 1, {step: 'opened', reLogin: false, extra: 1})
      )
    ).toBe('ParseError')
  })

  it('rejects counters above the cap', () => {
    expect(
      failureTag(
        decode('marketplaceWeekly', 1, {
          marketplaceOpened: 51,
          firstLoadResult: 'offers',
        })
      )
    ).toBe('ParseError')
  })
})

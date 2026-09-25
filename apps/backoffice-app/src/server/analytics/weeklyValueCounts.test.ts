import {DayString} from '@vexl-next/analytics-definitions/src/core'
import {Schema} from 'effect'
import {describe, expect, it} from 'vitest'
import {
  instancesOf,
  payloadValueCounts,
  toValueCounts,
  type WeeklyValueCountRow,
} from './weeklyValueCounts'

const row = (
  key: string,
  value: string,
  count: number
): WeeklyValueCountRow => ({
  weekStart: Schema.decodeSync(DayString)('2026-09-21'),
  countryPrefix: '420',
  key,
  value,
  count,
})

describe('payload histograms', () => {
  it('counts the snake_case JSON keys stored by metrics-service', () => {
    const values = toValueCounts([
      row('*', '*', 25),
      row('contacts_import', 'success', 25),
      row('activated_by', 'offer', 25),
      row('first_load_result', 'empty', 25),
      row('marketplace_opened', '2', 25),
      row('offers_visible_bucket', '0', 25),
    ])

    expect(instancesOf(values)).toBe(25)
    expect(payloadValueCounts(values, 'contactsImport')).toEqual({success: 25})
    expect(payloadValueCounts(values, 'activatedBy')).toEqual({offer: 25})
    expect(payloadValueCounts(values, 'firstLoadResult')).toEqual({empty: 25})
    expect(payloadValueCounts(values, 'marketplaceOpened')).toEqual({'2': 25})
    expect(payloadValueCounts(values, 'offersVisibleBucket')).toEqual({'0': 25})
  })

  it('combines database and definition spellings without changing enum values', () => {
    const values = toValueCounts([
      row('registration_to_activation', 'd2To7', 20),
      row('registrationToActivation', 'd2To7', 30),
    ])

    expect(payloadValueCounts(values, 'registrationToActivation')).toEqual({
      d2To7: 50,
    })
  })
})

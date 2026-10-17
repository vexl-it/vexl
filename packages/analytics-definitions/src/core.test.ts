import {describe, expect, it} from 'vitest'
import {analyticsStateMaxAgeDays, defaultAnalyticsWindow} from './core'

describe('analyticsStateMaxAgeDays', () => {
  it('adds grace to the journey lifetime', () => {
    expect(
      analyticsStateMaxAgeDays(
        {kind: 'journey', lifetimeDays: 7},
        defaultAnalyticsWindow
      )
    ).toBe(14)
  })

  it('counts settle days from the bucket end', () => {
    expect(
      analyticsStateMaxAgeDays(
        {kind: 'aggregation', period: 'week'},
        defaultAnalyticsWindow
      )
    ).toBe(20)
    expect(
      analyticsStateMaxAgeDays(
        {kind: 'aggregation', period: 'month'},
        defaultAnalyticsWindow
      )
    ).toBe(44)
  })
})

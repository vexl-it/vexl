import {describe, expect, it} from 'vitest'
import {
  approvedRequestClass,
  createdOfferClass,
  isClubCoreAction,
  isMainCoreAction,
  markCoreAction,
  sentRequestClass,
} from './coreAction'

describe('createdOfferClass', () => {
  it('is main, and also Club when shared to a Club', () => {
    expect(createdOfferClass(0)).toBe('main')
    expect(createdOfferClass(1)).toBe('mainAndClub')
    expect(createdOfferClass(3)).toBe('mainAndClub')
  })
})

describe('sentRequestClass', () => {
  it('is Club only when the offer came through Clubs alone', () => {
    expect(sentRequestClass(['CLUB'])).toBe('club')
    expect(sentRequestClass(['CLUB', 'NOT_SPECIFIED'])).toBe('club')
  })

  it('is main when a contact degree is present', () => {
    expect(sentRequestClass(['CLUB', 'FIRST_DEGREE'])).toBe('main')
    expect(sentRequestClass(['SECOND_DEGREE', 'CLUB'])).toBe('main')
    expect(sentRequestClass(['FIRST_DEGREE'])).toBe('main')
    expect(sentRequestClass([])).toBe('main')
  })
})

describe('approvedRequestClass', () => {
  it('counts as main', () => {
    expect(isMainCoreAction(approvedRequestClass)).toBe(true)
    expect(isClubCoreAction(approvedRequestClass)).toBe(false)
  })
})

describe('markCoreAction', () => {
  it('marks main, Club or both', () => {
    expect(markCoreAction('main')({})).toEqual({coreActionMain: true})
    expect(markCoreAction('club')({})).toEqual({coreActionClub: true})
    expect(markCoreAction('mainAndClub')({})).toEqual({
      coreActionMain: true,
      coreActionClub: true,
    })
  })

  it('keeps the other fields and earlier marks', () => {
    expect(
      markCoreAction('club')({coreActionMain: true, activeDays: 2})
    ).toEqual({coreActionMain: true, coreActionClub: true, activeDays: 2})
  })
})

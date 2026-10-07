import {type TFunction} from './localization/I18nProvider'
import {type OtherPersonRole} from './otherPersonRole'
import {
  formatTrustedFriendsNames,
  trustedFriendsCountText,
  trustedFriendsLine,
} from './trustedFriendsText'

const t: TFunction = (key, options) =>
  options ? `${key}${JSON.stringify(options)}` : key

describe('formatTrustedFriendsNames', () => {
  it('returns a single name as is', () => {
    expect(formatTrustedFriendsNames(['Jana Nováková'], t)).toBe(
      'Jana Nováková'
    )
  })

  it('joins two names', () => {
    expect(formatTrustedFriendsNames(['Jana', 'Petr'], t)).toBe(
      'commonFriends.twoNames{"first":"Jana","second":"Petr"}'
    )
  })

  it('names the first two and counts the rest', () => {
    expect(
      formatTrustedFriendsNames(['Jana', 'Petr', 'Lukáš', 'Tereza'], t)
    ).toBe(
      'commonFriends.twoNamesAndOthers{"first":"Jana","second":"Petr","count":2}'
    )
  })
})

describe('trustedFriendsLine', () => {
  it('is undefined without trusted friends', () => {
    expect(trustedFriendsLine({names: [], role: 'seller', t})).toBeUndefined()
  })

  const lineKeyByRole: ReadonlyArray<readonly [OtherPersonRole, string]> = [
    ['seller', 'commonFriends.trustedFriendsWithSeller'],
    ['buyer', 'commonFriends.trustedFriendsWithBuyer'],
    ['otherPerson', 'commonFriends.trustedFriendsWithOtherPerson'],
  ]

  it.each(lineKeyByRole)(
    'uses the %s wording with the total count',
    (role, key) => {
      expect(trustedFriendsLine({names: ['Jana'], role, t})).toBe(
        `${key}{"names":"Jana","count":1}`
      )
    }
  )
})

describe('trustedFriendsCountText', () => {
  it('is undefined for zero', () => {
    expect(trustedFriendsCountText(0, t)).toBeUndefined()
  })

  it('formats a positive count', () => {
    expect(trustedFriendsCountText(2, t)).toBe(
      'commonFriends.trustedCount{"count":2}'
    )
  })
})

import {
  OneOfferInState,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type QuickConnectPingCooldownStepsMinutes} from '@vexl-next/rest-api/src/services/user/contracts'
import {Array, Option, pipe, Schema} from 'effect'
import {
  activePings,
  hasUsedAllCooldownSteps,
  nextPingAllowedAt,
  recordPing,
  type QuickConnectPings,
} from './quickConnectCooldown'
import {
  pickQuickConnectTarget,
  rankQuickConnectCandidates,
} from './selectQuickConnectTarget'

const offerPublicKey =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVUTlhndG9GMVRBNVVrVWZ4YWFBbHp4cDBRSFlwZS8yVApFSk1nQXR0d0tabnZBZFBUVUNXdCtweGhpWGUzNDNlbjNndHI5OHZoS1pZSGc4VGRQT3JHMEE9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'

const offer = ({
  id,
  offerType = 'SELL',
  mine = false,
  reported = false,
}: {
  readonly id: string
  readonly offerType?: OfferType
  readonly mine?: boolean
  readonly reported?: boolean
}): OneOfferInState =>
  Schema.decodeSync(OneOfferInState)({
    offerInfo: {
      id: 1,
      offerId: id,
      privatePart: {
        commonFriends: [],
        friendLevel: ['FIRST_DEGREE'],
        symmetricKey: 'symmetric-key',
      },
      publicPart: {
        offerPublicKey,
        location: [],
        offerDescription: '',
        amountBottomLimit: 0,
        amountTopLimit: 0,
        feeState: 'WITHOUT_FEE',
        feeAmount: 0,
        locationState: [],
        paymentMethod: [],
        btcNetwork: [],
        currency: 'EUR',
        spokenLanguages: [],
        offerType,
        activePriceState: 'NONE',
        activePriceValue: 0,
        activePriceCurrency: 'EUR',
        active: true,
        groupUuids: [],
        listingType: 'BITCOIN',
        isQuickOffer: true,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-01-01T00:00:00.000Z',
    },
    flags: {reported},
    ownershipInfo: mine
      ? {adminId: `admin-${id}`, intendedConnectionLevel: 'ALL'}
      : undefined,
  })

const offerIds = (
  candidates: ReadonlyArray<{readonly offer: OneOfferInState}>
): readonly string[] =>
  Array.map(candidates, (one) => one.offer.offerInfo.offerId)

describe('quick connect target selection', () => {
  const commonFriends: Record<string, number> = {a: 1, b: 7, c: 3, d: 5, e: 0}
  const rank = (
    offers: readonly OneOfferInState[],
    canBeRequested: (offer: OneOfferInState) => boolean = () => true
  ): ReturnType<typeof rankQuickConnectCandidates> =>
    rankQuickConnectCandidates({
      offers,
      commonFriendsCount: (one) => commonFriends[one.offerInfo.offerId] ?? 0,
      canBeRequested,
    })

  it('ranks by common friends, most first', () => {
    const ranked = rank(
      Array.map(['a', 'b', 'c', 'd', 'e'], (id) => offer({id}))
    )
    expect(offerIds(ranked)).toEqual(['b', 'd', 'c', 'a', 'e'])
    expect(ranked[0]?.commonFriendsCount).toBe(7)
  })

  it('skips my own, reported and not requestable offers', () => {
    const ranked = rank(
      [
        offer({id: 'a'}),
        offer({id: 'b', mine: true}),
        offer({id: 'c', reported: true}),
        offer({id: 'd'}),
      ],
      (one) => one.offerInfo.offerId !== 'd'
    )
    expect(offerIds(ranked)).toEqual(['a'])
  })

  it('picks at random among the top three only', () => {
    const ranked = rank(
      Array.map(['a', 'b', 'c', 'd', 'e'], (id) => offer({id}))
    )
    const pickedWith = (random: number): string | undefined =>
      pipe(
        pickQuickConnectTarget(ranked, () => random),
        Option.map((one) => one.offer.offerInfo.offerId),
        Option.getOrUndefined
      )

    expect(pickedWith(0)).toBe('b')
    expect(pickedWith(0.5)).toBe('d')
    expect(pickedWith(0.999)).toBe('c')
  })

  it('picks nothing when nobody matches', () => {
    expect(Option.isNone(pickQuickConnectTarget([], () => 0))).toBe(true)
  })
})

describe('quick connect cooldown', () => {
  const MINUTE = 60 * 1000
  const steps: QuickConnectPingCooldownStepsMinutes = [2, 10, 30, 60]
  const at = (minutes: number): UnixMilliseconds =>
    UnixMilliseconds.make(1_000_000_000_000 + minutes * MINUTE)

  const pingAt = (
    minutesOfPings: readonly number[]
  ): QuickConnectPings | undefined =>
    Array.reduce<number, QuickConnectPings | undefined>(
      minutesOfPings,
      undefined,
      (pings, minute) =>
        recordPing({
          pings,
          lastAcceptedAt: undefined,
          now: at(minute),
          targetCommonFriendsCount: 4,
        })
    )

  const allowedAtMinute = (
    pings: QuickConnectPings | undefined,
    nowMinute: number,
    lastAcceptedAt?: number
  ): number | undefined =>
    pipe(
      nextPingAllowedAt({pings, steps, lastAcceptedAt, now: at(nowMinute)}),
      Option.map((allowedAt) => (allowedAt - at(0)) / MINUTE),
      Option.getOrUndefined
    )

  it('grows with every ping and repeats the last step', () => {
    expect(allowedAtMinute(pingAt([0]), 0)).toBe(2)
    expect(allowedAtMinute(pingAt([0, 2]), 2)).toBe(12)
    expect(allowedAtMinute(pingAt([0, 2, 12]), 12)).toBe(42)
    expect(allowedAtMinute(pingAt([0, 2, 12, 42]), 42)).toBe(102)
    expect(allowedAtMinute(pingAt([0, 2, 12, 42, 102]), 102)).toBe(162)
  })

  it('ends when the cooldown has passed', () => {
    expect(allowedAtMinute(pingAt([0]), 2)).toBeUndefined()
  })

  it('starts over after a day without pings', () => {
    const pings = pingAt([0, 2, 12, 42])
    expect(
      activePings({pings, lastAcceptedAt: undefined, now: at(42 + 24 * 60)})
    ).toBeUndefined()
    expect(pingAt([0, 2, 12, 42, 42 + 24 * 60])?.count).toBe(1)
  })

  it('starts over when someone accepts', () => {
    const pings = pingAt([0, 2])
    const acceptedAt = at(5)
    expect(allowedAtMinute(pings, 5, acceptedAt)).toBeUndefined()
    expect(
      recordPing({
        pings,
        lastAcceptedAt: acceptedAt,
        now: at(20),
        targetCommonFriendsCount: 1,
      })
    ).toEqual({
      count: 1,
      firstPingAt: at(20),
      lastPingAt: at(20),
      lastTargetCommonFriendsCount: 1,
    })
  })

  it('suggests a classic offer once every step was used', () => {
    const suggests = (pings: QuickConnectPings | undefined): boolean =>
      hasUsedAllCooldownSteps({
        pings,
        steps,
        lastAcceptedAt: undefined,
        now: at(60),
      })
    expect(suggests(pingAt([0, 2, 12]))).toBe(false)
    expect(suggests(pingAt([0, 2, 12, 42]))).toBe(true)
  })
})

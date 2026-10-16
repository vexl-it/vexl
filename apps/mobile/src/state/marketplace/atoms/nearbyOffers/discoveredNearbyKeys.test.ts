import {NearbyOfferKey, OfferId} from '@vexl-next/domain/src/general/offers'
import {Option, Schema} from 'effect'
import {
  nearbyOfferIdsToNotifyAbout,
  newlyDiscoveredNearbyKeys,
} from './discoveredNearbyKeys'

const rawKey = (fill: number): string =>
  Buffer.alloc(32, fill).toString('base64')
const key = (fill: number): NearbyOfferKey =>
  Schema.decodeSync(NearbyOfferKey)(rawKey(fill))
const offerId = (id: string): OfferId => Schema.decodeSync(OfferId)(id)

describe('newlyDiscoveredNearbyKeys', () => {
  it('returns keys that are neither received nor mine', () => {
    expect(
      newlyDiscoveredNearbyKeys({
        discoveredKeys: [rawKey(1), rawKey(2), rawKey(3)],
        receivedKeysByOfferId: {[offerId('offer-1')]: {key: key(1)}},
        myKeys: [key(2)],
      })
    ).toEqual([key(3)])
  })

  it('drops invalid and duplicate keys', () => {
    expect(
      newlyDiscoveredNearbyKeys({
        discoveredKeys: ['not-a-key', rawKey(1), rawKey(1)],
        receivedKeysByOfferId: {},
        myKeys: [],
      })
    ).toEqual([key(1)])
  })
})

describe('nearbyOfferIdsToNotifyAbout', () => {
  it('notifies about every discovered offer while in background', () => {
    expect(
      nearbyOfferIdsToNotifyAbout({
        discoveredOfferIds: [
          offerId('offer-1'),
          offerId('offer-2'),
          offerId('offer-1'),
        ],
        appState: 'background',
      })
    ).toEqual(Option.some([offerId('offer-1'), offerId('offer-2')]))
  })

  it('does not notify while the app is active', () => {
    expect(
      nearbyOfferIdsToNotifyAbout({
        discoveredOfferIds: [offerId('offer-1')],
        appState: 'active',
      })
    ).toEqual(Option.none())
  })

  it('does not notify when nothing was discovered', () => {
    expect(
      nearbyOfferIdsToNotifyAbout({
        discoveredOfferIds: [],
        appState: 'background',
      })
    ).toEqual(Option.none())
  })
})

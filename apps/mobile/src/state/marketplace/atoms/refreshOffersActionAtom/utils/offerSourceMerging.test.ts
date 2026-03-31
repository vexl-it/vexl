import {
  OfferInfo,
  OneOfferInState,
  type OfferFlags,
} from '@vexl-next/domain/src/general/offers'
import {Option, Schema} from 'effect'
import reportError from '../../../../../utils/reportError'
import {combineIncomingOffers} from './combineIncomingOffers'
import {mergeIncomingOffersToState} from './mergeIncomingOffersToState'

jest.mock('../../../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const CLUB_UUID = '11111111-1111-4111-8111-111111111111'
const SECOND_CLUB_UUID = '22222222-2222-4222-8222-222222222222'
const ADMIN_ID = 'offer-admin-id'

const createOfferInfo = ({
  id = 1,
  offerId = 'offer-id',
  modifiedAt,
  offerDescription = 'offer description',
  symmetricKey = 'symmetric-key',
  commonFriends,
  friendLevel,
  clubIds,
  adminId,
  intendedConnectionLevel,
  intendedClubs,
}: {
  id?: number
  offerId?: string
  modifiedAt: string
  offerDescription?: string
  symmetricKey?: string
  commonFriends: string[]
  friendLevel: Array<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'>
  clubIds: string[]
  adminId?: string
  intendedConnectionLevel?: 'FIRST' | 'ALL'
  intendedClubs?: string[]
}): typeof OfferInfo.Type =>
  Schema.decodeSync(OfferInfo)({
    id,
    offerId,
    privatePart: {
      commonFriends,
      verifiedCommonFriends: [],
      friendLevel,
      symmetricKey,
      clubIds,
      adminId,
      intendedConnectionLevel,
      intendedClubs,
    },
    publicPart: {
      offerPublicKey: 'offer-public-key',
      location: [],
      offerDescription,
      amountBottomLimit: 1,
      amountTopLimit: 2,
      feeState: 'WITHOUT_FEE',
      feeAmount: 0,
      locationState: ['ONLINE'],
      paymentMethod: ['CASH'],
      btcNetwork: ['LIGHTING'],
      currency: 'USD',
      spokenLanguages: ['ENG'],
      offerType: 'BUY',
      activePriceState: 'NONE',
      activePriceValue: 0,
      activePriceCurrency: 'USD',
      active: true,
      groupUuids: [],
    },
    createdAt: '2026-03-31T10:00:00.000Z',
    modifiedAt,
  })

const createStoredOffer = (
  offerInfo: typeof OfferInfo.Type,
  {
    flags = {reported: false},
  }: {
    flags?: OfferFlags
  } = {}
): typeof OneOfferInState.Type =>
  Schema.decodeSync(OneOfferInState)({
    offerInfo,
    flags,
  })

describe('offer source merging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('preserves club and contact data when both variants are fetched in one refresh', () => {
    const contactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })
    const clubOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })

    const combinedOffer = combineIncomingOffers([contactOffer, clubOffer])

    if (!Option.isSome(combinedOffer)) {
      throw new Error('Expected combined offer')
    }

    expect(combinedOffer.value.privatePart.commonFriends).toEqual(['friend-1'])
    expect(combinedOffer.value.privatePart.friendLevel).toEqual([
      'CLUB',
      'FIRST_DEGREE',
    ])
    expect(combinedOffer.value.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('uses the newest payload while preserving combined source metadata', () => {
    const olderContactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      offerDescription: 'older description',
      symmetricKey: 'older-symmetric-key',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })
    const newerClubOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      offerDescription: 'newer description',
      symmetricKey: 'newer-symmetric-key',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })

    const combinedOffer = combineIncomingOffers([
      olderContactOffer,
      newerClubOffer,
    ])

    if (!Option.isSome(combinedOffer)) {
      throw new Error('Expected combined offer')
    }

    expect(combinedOffer.value.publicPart.offerDescription).toBe(
      'newer description'
    )
    expect(combinedOffer.value.privatePart.symmetricKey).toBe(
      'newer-symmetric-key'
    )
    expect(combinedOffer.value.privatePart.commonFriends).toEqual(['friend-1'])
    expect(combinedOffer.value.privatePart.friendLevel).toEqual([
      'CLUB',
      'FIRST_DEGREE',
    ])
    expect(combinedOffer.value.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('preserves source metadata when timestamps are equal and club variant comes first', () => {
    const clubOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })
    const contactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })

    const combinedOffer = combineIncomingOffers([clubOffer, contactOffer])

    if (!Option.isSome(combinedOffer)) {
      throw new Error('Expected combined offer')
    }

    expect(combinedOffer.value.privatePart.commonFriends).toEqual(['friend-1'])
    expect(combinedOffer.value.privatePart.friendLevel).toEqual([
      'CLUB',
      'FIRST_DEGREE',
    ])
    expect(combinedOffer.value.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('preserves source metadata when timestamps are equal and contact variant comes first', () => {
    const contactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })
    const clubOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })

    const combinedOffer = combineIncomingOffers([contactOffer, clubOffer])

    if (!Option.isSome(combinedOffer)) {
      throw new Error('Expected combined offer')
    }

    expect(combinedOffer.value.privatePart.commonFriends).toEqual(['friend-1'])
    expect(combinedOffer.value.privatePart.friendLevel).toEqual([
      'FIRST_DEGREE',
      'CLUB',
    ])
    expect(combinedOffer.value.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('preserves all source metadata when more than two duplicates are merged in one refresh', () => {
    const contactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })
    const firstClubOffer = createOfferInfo({
      id: 2,
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })
    const secondClubOffer = createOfferInfo({
      id: 3,
      modifiedAt: '2026-03-31T10:02:00.000Z',
      offerDescription: 'newest description',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [SECOND_CLUB_UUID],
    })

    const combinedOffer = combineIncomingOffers([
      contactOffer,
      firstClubOffer,
      secondClubOffer,
    ])

    if (!Option.isSome(combinedOffer)) {
      throw new Error('Expected combined offer')
    }

    expect(combinedOffer.value.publicPart.offerDescription).toBe(
      'newest description'
    )
    expect(combinedOffer.value.privatePart.commonFriends).toEqual(['friend-1'])
    expect(combinedOffer.value.privatePart.friendLevel).toEqual([
      'CLUB',
      'FIRST_DEGREE',
    ])
    expect(combinedOffer.value.privatePart.clubIds).toEqual([
      SECOND_CLUB_UUID,
      CLUB_UUID,
    ])
  })

  it('preserves fallback private fields from older payload when newest payload does not include them', () => {
    const olderOfferWithOwnerInfo = createOfferInfo({
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
      adminId: ADMIN_ID,
      intendedConnectionLevel: 'ALL',
      intendedClubs: [CLUB_UUID],
    })
    const newerOfferWithoutOwnerInfo = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })

    const combinedOffer = combineIncomingOffers([
      olderOfferWithOwnerInfo,
      newerOfferWithoutOwnerInfo,
    ])

    if (!Option.isSome(combinedOffer)) {
      throw new Error('Expected combined offer')
    }

    expect(combinedOffer.value.privatePart.adminId).toBe(ADMIN_ID)
    expect(combinedOffer.value.privatePart.intendedConnectionLevel).toBe('ALL')
    expect(combinedOffer.value.privatePart.intendedClubs).toEqual([CLUB_UUID])
  })

  it('preserves contact data when a stored contact offer is later fetched from club', () => {
    const storedContactOffer = createStoredOffer(
      createOfferInfo({
        modifiedAt: '2026-03-31T10:00:00.000Z',
        commonFriends: ['friend-1'],
        friendLevel: ['SECOND_DEGREE'],
        clubIds: [],
      })
    )
    const incomingClubOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })

    const mergedOffers = mergeIncomingOffersToState({
      incomingOffers: [incomingClubOffer],
      storedOffers: [storedContactOffer],
      removedOffersIds: {
        clubs: [],
        contacts: [],
      },
    })

    expect(mergedOffers).toHaveLength(1)
    expect(mergedOffers[0]?.offerInfo.privatePart.commonFriends).toEqual([
      'friend-1',
    ])
    expect(mergedOffers[0]?.offerInfo.privatePart.friendLevel).toEqual([
      'CLUB',
      'SECOND_DEGREE',
    ])
    expect(mergedOffers[0]?.offerInfo.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('preserves stored flags when merging a newer incoming variant into state', () => {
    const storedOffer = createStoredOffer(
      createOfferInfo({
        modifiedAt: '2026-03-31T10:00:00.000Z',
        commonFriends: ['friend-1'],
        friendLevel: ['SECOND_DEGREE'],
        clubIds: [],
      }),
      {
        flags: {
          reported: true,
        },
      }
    )
    const incomingClubOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })

    const mergedOffers = mergeIncomingOffersToState({
      incomingOffers: [incomingClubOffer],
      storedOffers: [storedOffer],
      removedOffersIds: {
        clubs: [],
        contacts: [],
      },
    })

    expect(mergedOffers).toHaveLength(1)
    expect(mergedOffers[0]?.flags.reported).toBe(true)
    expect(mergedOffers[0]?.offerInfo.privatePart.commonFriends).toEqual([
      'friend-1',
    ])
    expect(mergedOffers[0]?.offerInfo.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('prefers the incoming payload when a same-day duplicate is merged into state', () => {
    const storedOffer = createStoredOffer(
      createOfferInfo({
        modifiedAt: '2026-03-31T00:00:00.000Z',
        offerDescription: 'stale description',
        commonFriends: ['friend-1'],
        friendLevel: ['FIRST_DEGREE'],
        clubIds: [],
      }),
      {
        flags: {
          reported: true,
        },
      }
    )
    const incomingOffer = createOfferInfo({
      modifiedAt: '2026-03-31T00:00:00.000Z',
      offerDescription: 'fresh description',
      commonFriends: ['friend-2'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })

    const mergedOffers = mergeIncomingOffersToState({
      incomingOffers: [incomingOffer],
      storedOffers: [storedOffer],
      removedOffersIds: {
        clubs: [],
        contacts: [],
      },
    })

    expect(mergedOffers).toHaveLength(1)
    expect(mergedOffers[0]?.flags.reported).toBe(true)
    expect(mergedOffers[0]?.offerInfo.publicPart.offerDescription).toBe(
      'fresh description'
    )
    expect(mergedOffers[0]?.offerInfo.privatePart.commonFriends).toEqual([
      'friend-2',
      'friend-1',
    ])
  })

  it('does not update stored owned offers from incoming non-owned variants', () => {
    const ownedStoredOffer = Schema.decodeSync(OneOfferInState)({
      offerInfo: createOfferInfo({
        modifiedAt: '2026-03-31T10:00:00.000Z',
        offerDescription: 'owned description',
        commonFriends: [],
        friendLevel: ['CLUB'],
        clubIds: [CLUB_UUID],
        adminId: ADMIN_ID,
        intendedConnectionLevel: 'ALL',
        intendedClubs: [CLUB_UUID],
      }),
      flags: {
        reported: false,
      },
      ownershipInfo: {
        adminId: ADMIN_ID,
        intendedConnectionLevel: 'ALL',
        intendedClubs: [CLUB_UUID],
      },
    })
    const incomingContactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      offerDescription: 'incoming description',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })

    const mergedOffers = mergeIncomingOffersToState({
      incomingOffers: [incomingContactOffer],
      storedOffers: [ownedStoredOffer],
      removedOffersIds: {
        clubs: [],
        contacts: [],
      },
    })

    expect(mergedOffers).toHaveLength(1)
    expect(mergedOffers[0]?.offerInfo.publicPart.offerDescription).toBe(
      'owned description'
    )
    expect(mergedOffers[0]?.offerInfo.privatePart.commonFriends).toEqual([])
    expect(mergedOffers[0]?.offerInfo.privatePart.clubIds).toEqual([CLUB_UUID])
    expect(mergedOffers[0]?.ownershipInfo?.adminId).toBe(ADMIN_ID)
  })

  it('preserves club data when a stored club offer is later fetched from contact', () => {
    const storedClubOffer = createStoredOffer(
      createOfferInfo({
        modifiedAt: '2026-03-31T10:00:00.000Z',
        commonFriends: [],
        friendLevel: ['CLUB'],
        clubIds: [CLUB_UUID],
      })
    )
    const incomingContactOffer = createOfferInfo({
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })

    const mergedOffers = mergeIncomingOffersToState({
      incomingOffers: [incomingContactOffer],
      storedOffers: [storedClubOffer],
      removedOffersIds: {
        clubs: [],
        contacts: [],
      },
    })

    expect(mergedOffers).toHaveLength(1)
    expect(mergedOffers[0]?.offerInfo.privatePart.commonFriends).toEqual([
      'friend-1',
    ])
    expect(mergedOffers[0]?.offerInfo.privatePart.friendLevel).toEqual([
      'FIRST_DEGREE',
      'CLUB',
    ])
    expect(mergedOffers[0]?.offerInfo.privatePart.clubIds).toEqual([CLUB_UUID])
  })

  it('returns none and reports an error when combining different offer ids', () => {
    const firstOffer = createOfferInfo({
      offerId: 'first-offer-id',
      modifiedAt: '2026-03-31T10:00:00.000Z',
      commonFriends: ['friend-1'],
      friendLevel: ['FIRST_DEGREE'],
      clubIds: [],
    })
    const secondOffer = createOfferInfo({
      offerId: 'second-offer-id',
      modifiedAt: '2026-03-31T10:01:00.000Z',
      commonFriends: [],
      friendLevel: ['CLUB'],
      clubIds: [CLUB_UUID],
    })

    const combinedOffer = combineIncomingOffers([firstOffer, secondOffer])

    expect(Option.isNone(combinedOffer)).toBe(true)
    expect(reportError).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledWith(
      'error',
      expect.any(Error),
      expect.objectContaining({
        ids: ['first-offer-id', 'second-offer-id'],
      })
    )
  })
})

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  generateAdminId,
  newOfferId,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {fromJsDate} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import dayjs from 'dayjs'
import {Effect, Schema} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
const clubKeypairForUser1 = generatePrivateKey()
let user2: MockedUser
const clubKeypairForUser2 = generatePrivateKey()
let user3: MockedUser
const clubKeypairForUser3 = generatePrivateKey()
let me: MockedUser
const clubKeypairForMe = generatePrivateKey()

let offer1: CreateNewOfferResponse
let offer2: CreateNewOfferResponse
let offer3: CreateNewOfferResponse

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      me = yield* _(createMockedUser('+420733333330'))
      user1 = yield* _(createMockedUser('+420733333331'))
      user2 = yield* _(createMockedUser('+420733333332'))
      user3 = yield* _(createMockedUser('+420733333333'))

      const client = yield* _(NodeTestingApp)

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(user1.authHeaders))

      offer1 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request1,
          })
        )),
        adminId: request1.adminId,
      }

      const request2: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer2payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(user2.authHeaders))

      offer2 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request2,
          })
        )),
        adminId: request2.adminId,
      }

      const request3: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer3payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer3payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer3payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(user2.authHeaders))

      offer3 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request3,
          })
        )),
        adminId: request3.adminId,
      }

      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`
        UPDATE offer_private
        SET
          created_at = now() - interval '10 day';
      `)
    })
  )
})

describe('Get club offers for me modified or created after', () => {
  it('Returns club offers for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '7 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter({
            payload: {
              modifiedAt,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW()
          WHERE
            offer_id = ${offer2.offerId};
        `)

        expect(clubOffers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Returns club offers for me that have public parts not modified after but private parts were uploaded after', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)

        yield* _(sql`
          UPDATE offer_private
          SET
            created_at = NOW()
          WHERE
            id IN (
              SELECT
                offer_private.id
              FROM
                offer_public
                LEFT JOIN offer_private ON offer_public.id = offer_private.offer_id
              WHERE
                offer_public.offer_id = ${offer2.offerId}
            )
        `)

        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(0, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        yield* _(setAuthHeaders(me.authHeaders))
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter({
            payload: {
              modifiedAt,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW()
          WHERE
            offer_id = ${offer2.offerId};
        `)

        yield* _(sql`
          UPDATE offer_private
          SET
            created_at = now() - interval '10 day';
        `)

        expect(clubOffers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Does not return expired club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        yield* _(setAuthHeaders(me.authHeaders))
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter({
            payload: {
              modifiedAt,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])}
        `)

        expect(clubOffers.offers.map((o) => o.offerId)).toEqual([])
      })
    )
  })

  it('Does not return flagged club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter({
            payload: {
              modifiedAt,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])};
        `)

        expect(clubOffers.offers.map((o) => o.offerId)).toEqual([])
      })
    )
  })
})

describe('Get club offers for me modified or created after paginated', () => {
  it('Returns paginated club offers for me (3 offers and 2 per page) with correct number of elements per page, hasNext prop set and nextPageToken set', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const limit = 2
        const response1 = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        expect(response1.items.length).toEqual(limit)
        expect(response1.hasNext).toBe(true)
        expect(response1.nextPageToken).not.toBeNull()

        const requestWithChallenge2 = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const response2 = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge2.publicKey,
              signedChallenge: requestWithChallenge2.signedChallenge,
              nextPageToken: response1.nextPageToken!,
            },
          })
        )

        expect(response2.items.length).not.toEqual(limit)
        expect(response2.items.length).toEqual(1)
        expect(response2.hasNext).toBe(false)
        expect(response2.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Returns paginated club offers for me (3 offers and 3 per page) with correct number of elements per page, hasNext prop set and nextPageToken set', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const limit = 3
        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        expect(response.items.length).toEqual(limit)
        expect(response.hasNext).toBe(false)
        expect(response.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Should handle large page size for club offers properly', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        // Ensure all offers are visible
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '1 day',
            refreshed_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])};
        `)

        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        // Test with limit larger than available data
        const limit = 100
        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        expect(response.items.length).toEqual(3)
        expect(response.hasNext).toBe(false)
        expect(response.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Should handle empty result for club offers properly', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForUser3, user3.authHeaders)({})
        )

        yield* _(setAuthHeaders(user3.authHeaders))

        const limit = 3
        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        expect(response.items.length).toEqual(0)
        expect(response.hasNext).toBe(false)
        expect(response.nextPageToken).toBeNull()
      })
    )
  })

  it('Does not return expired club offers (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const limit = 3
        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])}
        `)

        expect(response.items.map((o) => o.offerId)).toEqual([offer1.offerId])
      })
    )
  })

  it('Does not return flagged club offers (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `)

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer3.offerId};
        `)
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const limit = 3
        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])}
        `)

        expect(response.items.map((o) => o.offerId)).toEqual([offer1.offerId])
      })
    )
  })

  it('Should throw error for invalid nextPageToken for club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const limit = 3
        const result = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit,
              nextPageToken: 'invalid',
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidNextPageTokenError)(result)
      })
    )
  })
})

describe('Get removed club offers', () => {
  it('Returns removed club offers when offer removed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
          offerPrivateList: [
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForMe.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        yield* _(setAuthHeaders(user1.authHeaders))

        const newOffer = yield* _(
          client.createNewOffer({
            payload: request,
          })
        )

        const offerIds = [newOffer.offerId, offer1.offerId]

        const firstRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const removedClubOffers = yield* _(
          client.getRemovedClubOffers({
            payload: {
              publicKey: firstRequestWithChallenge.publicKey,
              signedChallenge: firstRequestWithChallenge.signedChallenge,
              offerIds,
            },
          })
        )

        expect(removedClubOffers.offerIds).toEqual([])

        yield* _(setAuthHeaders(me.authHeaders))

        yield* _(
          client.deleteOffer({
            urlParams: {adminIds: [newOffer.adminId]},
          })
        )

        const secondRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const removedClubOffers2 = yield* _(
          client.getRemovedClubOffers({
            payload: {
              publicKey: secondRequestWithChallenge.publicKey,
              signedChallenge: secondRequestWithChallenge.signedChallenge,
              offerIds,
            },
          })
        )

        expect(removedClubOffers2.offerIds.join()).toEqual(
          [newOffer.offerId].join()
        )
      })
    )
  })

  it('Returns removed club offers when offer expired', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const offerIds = [offer1.offerId, offer2.offerId]

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const clubOffers = yield* _(
          client.getRemovedClubOffers({
            payload: {
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
              offerIds,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(clubOffers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Returns deleted club offers when offer flagged', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const offerIds = [offer1.offerId, offer2.offerId]

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const clubOffers = yield* _(
          client.getRemovedClubOffers({
            payload: {
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
              offerIds,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(clubOffers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })
})

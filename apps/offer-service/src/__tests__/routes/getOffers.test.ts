/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqlClient} from '@effect/sql'
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
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import dayjs from 'dayjs'
import {Effect, Schema} from 'effect'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser
let me: MockedUser
let offer1: CreateNewOfferResponse
let offer2: CreateNewOfferResponse

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      me = yield* _(createMockedUser('+420733333330'))
      user1 = yield* _(createMockedUser('+420733333331'))
      user2 = yield* _(createMockedUser('+420733333332'))

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
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },

          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(me.authHeaders))

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
            payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },

          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer2 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request2,
          })
        )),
        adminId: request2.adminId,
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

describe('Get offers by ids', () => {
  it('Returns offers by ids', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const offersById = yield* _(
          client.getOffersByIds({
            urlParams: {ids: [offer1!.offerId, offer2!.offerId]},
          })
        )

        expect(
          offersById
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer1.offerId, offer2.offerId].sort().join())
      })
    )
  })

  it('Does not return expired offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const offersById = yield* _(
          client.getOffersByIds({
            urlParams: {ids: [offer1!.offerId, offer2!.offerId]},
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            offer_id = ${offer1.offerId};
        `)

        expect(
          offersById
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Does not return flagged offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer1.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const offersById = yield* _(
          client.getOffersByIds({
            urlParams: {ids: [offer1!.offerId, offer2!.offerId]},
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            offer_id = ${offer1.offerId};
        `)

        expect(offersById.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Does not fail when calling with not existing ids', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const offersById = yield* _(
          client.getOffersByIds({
            urlParams: {ids: [offer1!.offerId, offer2!.offerId, newOfferId()]},
          })
        )

        expect(
          offersById
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer1.offerId, offer2.offerId].sort().join())
      })
    )
  })
})

describe('Get offers for me modified or expired after', () => {
  it('Returns offers for me', async () => {
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
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        yield* _(setAuthHeaders(me.authHeaders))

        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter({
            urlParams: {
              modifiedAt,
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

        expect(offers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Returns offers for me that have public parts not modified after but private parts were uploaded after', async () => {
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

        yield* _(setAuthHeaders(me.authHeaders))
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter({
            urlParams: {
              modifiedAt,
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

        expect(offers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Does not return expired offers', async () => {
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
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        yield* _(setAuthHeaders(me.authHeaders))
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter({
            urlParams: {
              modifiedAt,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(offers.offers.map((o) => o.offerId)).toEqual([])
      })
    )
  })

  it('Does not return flagged offers', async () => {
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
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        yield* _(setAuthHeaders(me.authHeaders))
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter({
            urlParams: {
              modifiedAt,
            },
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(offers.offers.map((o) => o.offerId)).toEqual([])
      })
    )
  })
})

describe('Get removed offers', () => {
  it('Returns removed offers when offer removed', async () => {
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
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.mainKeyPair.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        yield* _(setAuthHeaders(me.authHeaders))

        const newOffer = yield* _(
          client.createNewOffer({
            payload: request,
          })
        )
        const offerIds = [newOffer.offerId, offer1.offerId]

        yield* _(setAuthHeaders(user1.authHeaders))

        const removedOffers = yield* _(
          client.getRemovedOffers({
            payload: {offerIds},
          })
        )
        expect(removedOffers.offerIds).toEqual([])

        yield* _(setAuthHeaders(me.authHeaders))

        yield* _(
          client.deleteOffer({
            urlParams: {adminIds: [newOffer.adminId]},
          })
        )

        yield* _(setAuthHeaders(user1.authHeaders))

        const removedOffers2 = yield* _(
          client.getRemovedOffers({
            payload: {offerIds},
          })
        )
        expect(removedOffers2.offerIds.join()).toEqual(
          [newOffer.offerId].join()
        )
      })
    )
  })

  it('Returns removed offers when offer expired', async () => {
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

        yield* _(setAuthHeaders(user1.authHeaders))

        const offers = yield* _(
          client.getRemovedOffers({
            payload: {offerIds},
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(offers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Returns deleted offers when offer flagged', async () => {
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

        yield* _(setAuthHeaders(user1.authHeaders))

        const offers = yield* _(
          client.getRemovedOffers({
            payload: {offerIds},
          })
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(offers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })
})

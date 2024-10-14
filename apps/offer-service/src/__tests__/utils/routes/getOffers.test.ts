/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
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
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import dayjs from 'dayjs'
import {Effect} from 'effect'
import {NodeTestingApp} from '../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../runPromiseInMockedEnvironment'

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const me = generatePrivateKey()
let offer1: CreateNewOfferResponse
let offer2: CreateNewOfferResponse

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },

          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer1 = {
        ...(yield* _(
          client.createNewOffer(
            {body: request1},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
        )),
        adminId: request1.adminId,
      }

      const request2: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },

          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer2 = {
        ...(yield* _(
          client.createNewOffer(
            {body: request2},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offersById = yield* _(
          client.getOffersByIds(
            {query: {ids: [offer1!.offerId, offer2!.offerId]}},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offersById = yield* _(
          client.getOffersByIds(
            {query: {ids: [offer1!.offerId, offer2!.offerId]}},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offersById = yield* _(
          client.getOffersByIds(
            {query: {ids: [offer1!.offerId, offer2!.offerId]}},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offersById = yield* _(
          client.getOffersByIds(
            {query: {ids: [offer1!.offerId, offer2!.offerId, newOfferId()]}},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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

describe('Get offers for me', () => {
  it('Returns offers for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const offers = yield* _(
          client.getOffersForMe(
            {},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
        )

        expect(
          offers.offers
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
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '7 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const offers = yield* _(
          client.getOffersForMe(
            {},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            offer_id = ${offer1.offerId}
            OR offer_id = ${offer2.offerId};
        `)

        expect(offers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
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
        const offers = yield* _(
          client.getOffersForMe(
            {},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            offer_id = ${offer1.offerId};
        `)

        expect(offers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
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
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter(
            {
              query: {
                modifiedAt: fromJsDate(dayjs().subtract(2, 'days').toDate()),
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter(
            {
              query: {
                modifiedAt: fromJsDate(dayjs().subtract(0, 'days').toDate()),
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter(
            {
              query: {
                modifiedAt: fromJsDate(dayjs().subtract(2, 'days').toDate()),
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offers = yield* _(
          client.getOffersForMeModifiedOrCreatedAfter(
            {
              query: {
                modifiedAt: fromJsDate(dayjs().subtract(2, 'days').toDate()),
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const newOffer = yield* _(
          client.createNewOffer(
            {body: request},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
        )

        const removedOffers = yield* _(
          client.getRemovedOffers(
            {
              body: {offerIds: [newOffer.offerId, offer1.offerId]},
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
        )
        expect(removedOffers.offerIds).toEqual([])

        yield* _(
          client.deleteOffer(
            {query: {adminIds: [newOffer.adminId]}},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
        )

        const removedOffers2 = yield* _(
          client.getRemovedOffers(
            {
              body: {offerIds: [newOffer.offerId, offer1.offerId]},
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offers = yield* _(
          client.getRemovedOffers(
            {
              body: {offerIds: [offer1.offerId, offer2.offerId]},
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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
        const offers = yield* _(
          client.getRemovedOffers(
            {
              body: {offerIds: [offer1.offerId, offer2.offerId]},
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: user1.publicKeyPemBase64,
                })
              )
            )
          )
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

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  generateAdminId,
  newOfferId,
  PrivatePartRecordId,
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {objectToBase64UrlEncoded} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {LegacyPaginatedOfferNextPageToken} from '../../routes/utils/paginatedOfferNextPageToken'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {makeTestCommonAndSecurityHeadersWithPublicKeyV2} from '../utils/makeTestCommonAndSecurityHeadersWithPublicKeyV2'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

let user1: MockedUser
let user2: MockedUser
let user3: MockedUser
let me: MockedUser
let offer1: CreateNewOfferResponse
let offer2: CreateNewOfferResponse
let offer3: CreateNewOfferResponse
let commonAndSecurityHeaders: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      me = yield* createMockedUser('+420733333330')
      user1 = yield* createMockedUser('+420733333331')
      user2 = yield* createMockedUser('+420733333332')
      user3 = yield* createMockedUser('+420733333333')

      const client = yield* NodeTestingApp

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },

          {
            payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* setAuthHeaders(me.authHeaders)

      commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        me.authHeaders
      )

      offer1 = {
        ...(yield* client.createNewOffer({
          payload: request1,
          headers: commonAndSecurityHeaders,
        })),
        adminId: request1.adminId,
      }

      const request2: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },

          {
            payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer2 = {
        ...(yield* client.createNewOffer({
          payload: request2,
          headers: commonAndSecurityHeaders,
        })),
        adminId: request2.adminId,
      }

      const request3: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },

          {
            payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer3 = {
        ...(yield* client.createNewOffer({
          payload: request3,
          headers: commonAndSecurityHeaders,
        })),
        adminId: request3.adminId,
      }

      const sql = yield* SqlClient.SqlClient
      yield* sql`
        UPDATE offer_private
        SET
          created_at = now() - interval '10 day';
      `
    })
  )
})

describe('Get offers for me modified or created after paginated', () => {
  it('Returns paginated offers for me (3 offers and 2 per page) with correct number of elements per page, hasNext prop set and nextPageToken set', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const limit = 2
        const response1 =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(response1.items.length).toEqual(limit)
        expect(response1.hasNext).toBe(true)
        expect(response1.nextPageToken).not.toBeNull()

        const response2 =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
              nextPageToken: response1.nextPageToken!,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(response2.items.length).not.toEqual(limit)
        expect(response2.items.length).toEqual(1)
        expect(response2.hasNext).toBe(false)
        expect(response2.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Returns paginated offers for me (3 offers and 3 per page) with correct number of elements per page, hasNext prop set and nextPageToken set', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const limit = 3
        const response =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(response.items.length).toEqual(limit)
        expect(response.hasNext).toBe(false)
        expect(response.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Should handle large page size', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        // Ensure all offers are visible
        yield* sql`
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
        `

        const client = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)

        const testCommonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        // Test with limit larger than available data
        const limit = 100
        const response =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {limit},
            headers: testCommonAndSecurityHeaders,
          })

        expect(response.items.length).toEqual(3)
        expect(response.hasNext).toBe(false)
        expect(response.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Should handle empty result properly', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer3.offerId};
        `
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user3.authHeaders)

        const limit = 3
        const response =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(response.items.length).toEqual(0)
        expect(response.hasNext).toBe(false)
        expect(response.nextPageToken).toBeNull()
      })
    )
  })

  it('Does not return expired offers (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer3.offerId};
        `
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)
        const limit = 3
        const response =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
            },
            headers: commonAndSecurityHeaders,
          })

        yield* sql`
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
        `

        expect(response.items.map((o) => o.offerId)).toEqual([offer1.offerId])
      })
    )
  })

  it('Does not return flagged offers (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `
        yield* sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `

        yield* sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer3.offerId};
        `
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)
        const limit = 3
        const response =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
            },
            headers: commonAndSecurityHeaders,
          })

        yield* sql`
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
        `

        expect(response.items.map((o) => o.offerId)).toEqual([offer1.offerId])
      })
    )
  })

  it('Should throw error for invalid nextPageToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const limit = 3
        const result = yield* pipe(
          client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit,
              nextPageToken: 'invalid',
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )

        expectErrorResponse(InvalidNextPageTokenError)(result)
      })
    )
  })

  it('Accepts old nextPageToken format by refetching from the zero cursor', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const firstPageWithoutToken =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 2,
            },
            headers: commonAndSecurityHeaders,
          })
        const lastItemOfFirstPage = Array.last(firstPageWithoutToken.items)
        if (Option.isNone(lastItemOfFirstPage)) {
          throw new Error(
            'Expected the first page to contain at least one item'
          )
        }

        const legacyNextPageToken = yield* objectToBase64UrlEncoded({
          object: {
            lastPrivatePartId: Schema.decodeSync(PrivatePartRecordId)(
              lastItemOfFirstPage.value.id.toString()
            ),
          },
          schema: LegacyPaginatedOfferNextPageToken,
        })

        const responseFromLegacyToken =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 2,
              nextPageToken: legacyNextPageToken,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(responseFromLegacyToken.items.map((item) => item.id)).toEqual(
          firstPageWithoutToken.items.map((item) => item.id)
        )
      })
    )
  })

  it('Returns a public-only updated offer again after a stored new-format token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const firstFetch =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
          })

        yield* client.updateOffer({
          payload: {
            adminId: offer1.adminId,
            payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
              'publicPayloadAfterCursor'
            ),
            offerPrivateList: [],
          },
          headers: commonAndSecurityHeaders,
        })

        const secondFetch =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 20,
              nextPageToken: firstFetch.nextPageToken ?? undefined,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(secondFetch.items).toHaveLength(1)
        expect(secondFetch.items.at(0)?.offerId).toEqual(offer1.offerId)
        expect(secondFetch.items.at(0)?.publicPayload).toEqual(
          'publicPayloadAfterCursor'
        )
      })
    )
  })

  it('Returns a replaced private part again for the affected recipient after a stored new-format token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const user1Headers = makeTestCommonAndSecurityHeaders(user1.authHeaders)

        yield* setAuthHeaders(user1.authHeaders)

        const firstFetch =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 20,
            },
            headers: user1Headers,
          })

        yield* setAuthHeaders(me.authHeaders)
        yield* client.createPrivatePart({
          payload: {
            adminId: offer1.adminId,
            offerPrivateList: [
              {
                userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                payloadPrivate: Schema.decodeUnknownSync(
                  PrivatePayloadEncrypted
                )('0privatePayloadAfterCursor'),
              },
            ],
          },
        })

        yield* setAuthHeaders(user1.authHeaders)
        const secondFetch =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 20,
              nextPageToken: firstFetch.nextPageToken ?? undefined,
            },
            headers: user1Headers,
          })

        expect(secondFetch.items).toHaveLength(1)
        expect(secondFetch.items.at(0)?.offerId).toEqual(offer1.offerId)
        expect(secondFetch.items.at(0)?.privatePayload).toEqual(
          '0privatePayloadAfterCursor'
        )
      })
    )
  })

  it('Does not return offers again after refreshOffer when only refreshed_at changes', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const firstFetch =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
          })

        yield* client.refreshOffer({
          payload: {
            adminIds: [offer2.adminId],
          },
        })

        const secondFetch =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 20,
              nextPageToken: firstFetch.nextPageToken ?? undefined,
            },
            headers: commonAndSecurityHeaders,
          })

        expect(secondFetch.items).toHaveLength(0)
      })
    )
  })

  it('Paginates stably when a requester matches two private rows with the same effective change counter', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const requester = yield* createMockedUser('+420733333334')
        const requesterPublicKeyV2 = yield* generateV2KeyPair()
        const sql = yield* SqlClient.SqlClient
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user1.authHeaders)
        const ownerHeaders = makeTestCommonAndSecurityHeaders(user1.authHeaders)

        const createdOffer = yield* client.createNewOffer({
          payload: {
            adminId: generateAdminId(),
            countryPrefix: Schema.decodeSync(CountryPrefix)(420),
            offerPrivateList: [
              {
                payloadPrivate: Schema.decodeUnknownSync(
                  PrivatePayloadEncrypted
                )('0ownerPrivatePayloadForSharedCounter'),
                userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
              },
              {
                payloadPrivate: Schema.decodeUnknownSync(
                  PrivatePayloadEncrypted
                )('0requesterPrivatePayloadV1'),
                userPublicKey: requester.mainKeyPair.publicKeyPemBase64,
              },
              {
                payloadPrivate: Schema.decodeUnknownSync(
                  PrivatePayloadEncrypted
                )('0requesterPrivatePayloadV2'),
                userPublicKey: requesterPublicKeyV2.publicKey,
              },
            ],
            offerType: 'BUY',
            payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
              'payloadPublicSharedCounterBeforeUpdate'
            ),
            offerId: newOfferId(),
          },
          headers: ownerHeaders,
        })

        yield* client.updateOffer({
          payload: {
            adminId: createdOffer.adminId,
            payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
              'payloadPublicSharedCounterAfterUpdate'
            ),
            offerPrivateList: [],
          },
          headers: ownerHeaders,
        })

        const requesterHeaders =
          yield* makeTestCommonAndSecurityHeadersWithPublicKeyV2({
            authHeaders: requester.authHeaders,
            publicKeyV2: requesterPublicKeyV2.publicKey,
          })
        yield* setAuthHeaders(requester.authHeaders)

        const firstPage =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 1,
            },
            headers: requesterHeaders,
          })

        const secondPage =
          yield* client.getOffersForMeModifiedOrCreatedAfterPaginated({
            query: {
              limit: 1,
              nextPageToken: firstPage.nextPageToken ?? undefined,
            },
            headers: requesterHeaders,
          })

        const publicRecord = yield* sql`
          SELECT
            id
          FROM
            offer_public
          WHERE
            offer_id = ${createdOffer.offerId}
        `
        const expectedPrivateParts = yield* sql`
          SELECT
            id
          FROM
            offer_private
          WHERE
            ${sql.and([
            sql`offer_id = ${publicRecord.at(0)?.id}`,
            sql.in('user_public_key', [
              requester.mainKeyPair.publicKeyPemBase64,
              requesterPublicKeyV2.publicKey,
            ]),
          ])}
          ORDER BY
            id ASC
        `

        expect(firstPage.items).toHaveLength(1)
        expect(firstPage.hasNext).toBe(true)
        expect(secondPage.items).toHaveLength(1)
        expect(secondPage.hasNext).toBe(false)
        expect(firstPage.items.at(0)?.offerId).toEqual(createdOffer.offerId)
        expect(secondPage.items.at(0)?.offerId).toEqual(createdOffer.offerId)
        expect(firstPage.items.at(0)?.id).toEqual(
          Number(expectedPrivateParts.at(0)?.id)
        )
        expect(secondPage.items.at(0)?.id).toEqual(
          Number(expectedPrivateParts.at(1)?.id)
        )
      })
    )
  })
})

describe('Get removed offers', () => {
  it('Returns removed offers when offer removed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefix)(420),
          offerPrivateList: [
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
            },
            {
              payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
            },

            {
              payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.mainKeyPair.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        yield* setAuthHeaders(me.authHeaders)

        const meHeaders = makeTestCommonAndSecurityHeaders(me.authHeaders)

        const newOffer = yield* client.createNewOffer({
          payload: request,
          headers: meHeaders,
        })
        const offerIds = [newOffer.offerId, offer1.offerId]

        yield* setAuthHeaders(user1.authHeaders)

        const user1Headers = makeTestCommonAndSecurityHeaders(user1.authHeaders)

        const removedOffers = yield* client.getRemovedOffers({
          payload: {offerIds},
          headers: user1Headers,
        })
        expect(removedOffers.offerIds).toEqual([])

        yield* setAuthHeaders(me.authHeaders)

        yield* client.deleteOffer({
          headers: testCommonHeaders,
          query: {adminIds: [newOffer.adminId]},
        })

        yield* setAuthHeaders(user1.authHeaders)

        const removedOffers2 = yield* client.getRemovedOffers({
          payload: {offerIds},
          headers: user1Headers,
        })
        expect(removedOffers2.offerIds.join()).toEqual(
          [newOffer.offerId].join()
        )
      })
    )
  })

  it('Returns removed offers when offer expired', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `
        const client = yield* NodeTestingApp
        const offerIds = [offer1.offerId, offer2.offerId]

        yield* setAuthHeaders(user1.authHeaders)

        const testHeaders = makeTestCommonAndSecurityHeaders(user1.authHeaders)

        const offers = yield* client.getRemovedOffers({
          payload: {offerIds},
          headers: testHeaders,
        })

        yield* sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `

        expect(offers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Returns deleted offers when offer flagged', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `
        const client = yield* NodeTestingApp
        const offerIds = [offer1.offerId, offer2.offerId]

        yield* setAuthHeaders(user1.authHeaders)

        const testHeaders = makeTestCommonAndSecurityHeaders(user1.authHeaders)

        const offers = yield* client.getRemovedOffers({
          payload: {offerIds},
          headers: testHeaders,
        })

        yield* sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `

        expect(offers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Does not report existing offers as removed when private part exists only under public key v2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        const client = yield* NodeTestingApp
        const publicKeyV2 = yield* generateV2KeyPair()

        yield* sql`
          UPDATE offer_private
          SET
            user_public_key = ${publicKeyV2.publicKey}
          WHERE
            id IN (
              SELECT
                offer_private.id
              FROM
                offer_public
                LEFT JOIN offer_private ON offer_public.id = offer_private.offer_id
              WHERE
                offer_public.offer_id = ${offer1.offerId}
                AND offer_private.user_public_key = ${me.mainKeyPair
            .publicKeyPemBase64}
            );
        `

        yield* setAuthHeaders(me.authHeaders)
        const commonAndSecurityHeadersWithPublicKeyV2 =
          yield* makeTestCommonAndSecurityHeadersWithPublicKeyV2({
            authHeaders: me.authHeaders,
            publicKeyV2: publicKeyV2.publicKey,
          })

        const offers = yield* client.getRemovedOffers({
          payload: {offerIds: [offer1.offerId]},
          headers: commonAndSecurityHeadersWithPublicKeyV2,
        })

        yield* sql`
          UPDATE offer_private
          SET
            user_public_key = ${me.mainKeyPair.publicKeyPemBase64}
          WHERE
            id IN (
              SELECT
                offer_private.id
              FROM
                offer_public
                LEFT JOIN offer_private ON offer_public.id = offer_private.offer_id
              WHERE
                offer_public.offer_id = ${offer1.offerId}
                AND offer_private.user_public_key = ${publicKeyV2.publicKey}
            );
        `

        expect(offers.offerIds).toEqual([])
      })
    )
  })
})

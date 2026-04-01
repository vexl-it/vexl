/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
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
import {
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {decodeOffersPaginationNextPageToken} from '../../routes/utils/offersPaginationCursor'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
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
let commonAndSecurityHeaders: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>

const LegacyGetClubOffersForMeNextPageToken = Schema.Struct({
  lastPrivatePartId: PrivatePartRecordId,
})

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
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(user1.authHeaders))

      commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        user1.authHeaders
      )

      offer1 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request1,
            headers: commonAndSecurityHeaders,
          })
        )),
        adminId: request1.adminId,
      }

      const request2: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0offer2payloadPrivate2' as PrivatePayloadEncrypted,
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
            headers: commonAndSecurityHeaders,
          })
        )),
        adminId: request2.adminId,
      }

      const request3: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0offer3payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0offer3payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0offer3payloadPrivate2' as PrivatePayloadEncrypted,
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
            headers: commonAndSecurityHeaders,
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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

  it('Returns only the updated club offer after a public-only update past the stored cursor', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)
        const publicKeyV2 = yield* _(generateV2KeyPair())

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = CURRENT_DATE,
            refreshed_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])}
        `)

        const firstRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders, publicKeyV2)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const initialResponse = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit: 3,
              publicKey: firstRequestWithChallenge.publicKey,
              publicKeyV2: firstRequestWithChallenge.publicKeyV2,
              signedChallenge: firstRequestWithChallenge.signedChallenge,
            },
          })
        )
        const initialCursor = yield* _(
          decodeOffersPaginationNextPageToken(initialResponse.nextPageToken!)
        )

        yield* _(setAuthHeaders(user1.authHeaders))

        const updatedPayloadPublic = Schema.decodeSync(PublicPayloadEncrypted)(
          'updatedClubPayloadPublic'
        )

        yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: updatedPayloadPublic,
              offerPrivateList: [],
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const secondRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders, publicKeyV2)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const incrementalResponse = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit: 3,
              nextPageToken: initialResponse.nextPageToken!,
              publicKey: secondRequestWithChallenge.publicKey,
              publicKeyV2: secondRequestWithChallenge.publicKeyV2,
              signedChallenge: secondRequestWithChallenge.signedChallenge,
            },
          })
        )
        const incrementalCursor = yield* _(
          decodeOffersPaginationNextPageToken(
            incrementalResponse.nextPageToken!
          )
        )

        expect(incrementalResponse.items.map((o) => o.offerId)).toEqual([
          offer1.offerId,
        ])

        expect(incrementalResponse.items.at(0)?.publicPayload).toEqual(
          updatedPayloadPublic
        )
        expect(incrementalCursor.lastPublicPartVersion).toBeGreaterThan(
          initialCursor.lastPublicPartVersion
        )
        expect(incrementalCursor.lastPrivatePartId).toEqual(
          initialCursor.lastPrivatePartId
        )
      })
    )
  })

  it('Returns private-only updated club offer past the stored cursor', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])}
        `)

        const firstRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForUser1, user1.authHeaders)({})
        )

        yield* _(setAuthHeaders(user1.authHeaders))

        const initialResponse = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit: 3,
              publicKey: firstRequestWithChallenge.publicKey,
              publicKeyV2: Option.none(),
              signedChallenge: firstRequestWithChallenge.signedChallenge,
            },
          })
        )
        const initialCursor = yield* _(
          decodeOffersPaginationNextPageToken(initialResponse.nextPageToken!)
        )

        const updatedPrivatePayload = Schema.decodeSync(
          PrivatePayloadEncrypted
        )('0updatedClubPrivatePayloadForUser1')

        yield* _(setAuthHeaders(user1.authHeaders))

        yield* _(
          client.createPrivatePart({
            payload: {
              adminId: offer1.adminId,
              offerPrivateList: [
                {
                  payloadPrivate: updatedPrivatePayload,
                  userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
                },
              ],
            },
          })
        )

        const secondRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForUser1, user1.authHeaders)({})
        )

        const incrementalResponse = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit: 3,
              nextPageToken: initialResponse.nextPageToken!,
              publicKey: secondRequestWithChallenge.publicKey,
              publicKeyV2: Option.none(),
              signedChallenge: secondRequestWithChallenge.signedChallenge,
            },
          })
        )
        const incrementalCursor = yield* _(
          decodeOffersPaginationNextPageToken(
            incrementalResponse.nextPageToken!
          )
        )

        expect(incrementalResponse.items.map((o) => o.offerId)).toEqual([
          offer1.offerId,
        ])
        expect(incrementalResponse.items.at(0)?.privatePayload).toEqual(
          updatedPrivatePayload
        )
        expect(incrementalCursor.lastPublicPartVersion).toEqual(
          initialCursor.lastPublicPartVersion
        )
        expect(incrementalCursor.lastPrivatePartId).toBeGreaterThan(
          initialCursor.lastPrivatePartId
        )
      })
    )
  })

  it('Accepts legacy nextPageToken for club offers and falls back to a full resync cursor', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            public_part_version = CASE
              WHEN offer_id = ${offer1.offerId} THEN 1
              WHEN offer_id = ${offer2.offerId} THEN 2
              WHEN offer_id = ${offer3.offerId} THEN 3
            END,
            refreshed_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [
            offer1.offerId,
            offer2.offerId,
            offer3.offerId,
          ])}
        `)

        const legacyNextPageToken = yield* _(
          objectToBase64UrlEncoded({
            object: {
              lastPrivatePartId:
                Schema.decodeSync(PrivatePartRecordId)('999999'),
            },
            schema: LegacyGetClubOffersForMeNextPageToken,
          })
        )

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit: 2,
              nextPageToken: legacyNextPageToken,
              publicKey: requestWithChallenge.publicKey,
              publicKeyV2: Option.none(),
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        expect(response.items.map((o) => o.offerId)).toEqual([
          offer1.offerId,
          offer2.offerId,
        ])
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
              publicKeyV2: Option.none(),
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
          countryPrefix: Schema.decodeSync(CountryPrefix)(420),
          offerPrivateList: [
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
            },
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
            },
            {
              payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
            },

            {
              payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForMe.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        yield* _(setAuthHeaders(user1.authHeaders))

        const testHeaders = makeTestCommonAndSecurityHeaders(user1.authHeaders)

        const newOffer = yield* _(
          client.createNewOffer({payload: request, headers: testHeaders})
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
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

  it('Does not report existing club offers as removed when private part exists only under public key v2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        const client = yield* _(NodeTestingApp)
        const publicKeyV2 = yield* _(generateV2KeyPair())

        yield* _(sql`
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
                AND offer_private.user_public_key = ${clubKeypairForMe.publicKeyPemBase64}
            );
        `)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders, publicKeyV2)({})
        )
        yield* _(setAuthHeaders(me.authHeaders))

        const removedOffers = yield* _(
          client.getRemovedClubOffers({
            payload: {
              publicKey: requestWithChallenge.publicKey,
              publicKeyV2: requestWithChallenge.publicKeyV2,
              signedChallenge: requestWithChallenge.signedChallenge,
              offerIds: [offer1.offerId],
            },
          })
        )

        yield* _(sql`
          UPDATE offer_private
          SET
            user_public_key = ${clubKeypairForMe.publicKeyPemBase64}
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
        `)

        expect(removedOffers.offerIds).toEqual([])
      })
    )
  })
})

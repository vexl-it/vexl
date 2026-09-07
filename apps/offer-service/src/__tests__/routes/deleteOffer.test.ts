import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateAdminId,
  newOfferId,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type CreateNewOfferRequest} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {makeTestCommonAndSecurityHeaders} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

type DummyAuthHeaders = Parameters<typeof makeTestCommonAndSecurityHeaders>[0]

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createOffer = (authHeaders: DummyAuthHeaders) =>
  Effect.gen(function* () {
    const user1 = generatePrivateKey()
    const user2 = generatePrivateKey()

    const request: CreateNewOfferRequest = {
      adminId: generateAdminId(),
      countryPrefix: Schema.decodeSync(CountryPrefix)(420),
      offerPrivateList: [
        {
          payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
          userPublicKey: user1.publicKeyPemBase64,
        },
        {
          payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
          userPublicKey: user2.publicKeyPemBase64,
        },
        {
          payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
          userPublicKey: authHeaders['public-key'],
        },
      ],
      offerType: 'BUY',
      payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
      offerId: newOfferId(),
    }

    const client = yield* NodeTestingApp

    yield* setAuthHeaders(authHeaders)

    const commonAndSecurityHeaders =
      makeTestCommonAndSecurityHeaders(authHeaders)

    return yield* client.createNewOffer({
      payload: request,
      headers: commonAndSecurityHeaders,
    })
  })

describe('Delete offer', () => {
  it('Deletes offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = generatePrivateKey()
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        const offer1 = yield* createOffer(authHeaders)
        const offer2 = yield* createOffer(authHeaders)
        const offer3 = yield* createOffer(authHeaders)
        const offer4 = yield* createOffer(authHeaders)

        const sql = yield* SqlClient.SqlClient
        const createdPublic = yield* sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(createdPublic.length).toBeGreaterThan(0)

        const createdPrivate = yield* sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(createdPrivate.length).toBeGreaterThan(0)

        const api = yield* NodeTestingApp

        yield* setAuthHeaders(authHeaders)

        yield* api.deleteOffer({
          headers: testCommonHeaders,
          query: {adminIds: [offer1.adminId, offer2.adminId]},
        })

        const removedPublic = yield* sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(removedPublic.length).toEqual(0)

        const removedPrivate = yield* sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(removedPrivate.length).toEqual(0)

        const notRemovedPublic = yield* sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer3.offerId, offer4.offerId])}
        `
        expect(notRemovedPublic.length).toEqual(2)

        const notRemovedPrivate = yield* sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer3.offerId, offer4.offerId])}
        `
        expect(notRemovedPrivate.length).toEqual(6)
      })
    )
  })

  it('Does not fail when deleting offers using empty adminIds', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = generatePrivateKey()
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        const api = yield* NodeTestingApp

        yield* setAuthHeaders(authHeaders)

        yield* api.deleteOffer({
          headers: testCommonHeaders,
          query: {adminIds: []},
        })
      })
    )
  })

  it('Does not fail when deleting non existing offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = generatePrivateKey()
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        const offer1 = yield* createOffer(authHeaders)
        const offer2 = yield* createOffer(authHeaders)

        const sql = yield* SqlClient.SqlClient
        const createdPublic = yield* sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(createdPublic.length).toBeGreaterThan(0)

        const createdPrivate = yield* sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(createdPrivate.length).toBeGreaterThan(0)

        const api = yield* NodeTestingApp

        yield* setAuthHeaders(authHeaders)

        yield* api.deleteOffer({
          headers: testCommonHeaders,
          query: {
            adminIds: [offer1.adminId, offer2.adminId, generateAdminId()],
          },
        })

        const removedPublic = yield* sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(removedPublic.length).toEqual(0)

        const removedPrivate = yield* sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `
        expect(removedPrivate.length).toEqual(0)
      })
    )
  })
})

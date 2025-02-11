import {HttpClientRequest} from '@effect/platform'
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
import {type SecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {type CreateNewOfferRequest} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createOffer = (authHeaders: SecurityHeaders) =>
  Effect.gen(function* (_) {
    const user1 = generatePrivateKey()
    const user2 = generatePrivateKey()

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
          userPublicKey: authHeaders['public-key'],
        },
      ],
      offerType: 'BUY',
      payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
      offerId: newOfferId(),
    }

    const client = yield* _(NodeTestingApp)

    return yield* _(
      client.createNewOffer(
        {body: request},
        HttpClientRequest.setHeaders(authHeaders)
      )
    )
  })

describe('Delete offer', () => {
  it('Deletes offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = generatePrivateKey()
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        const offer1 = yield* _(createOffer(authHeaders))
        const offer2 = yield* _(createOffer(authHeaders))
        const offer3 = yield* _(createOffer(authHeaders))
        const offer4 = yield* _(createOffer(authHeaders))

        const sql = yield* _(SqlClient.SqlClient)
        const createdPublic = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(createdPublic.length).toBeGreaterThan(0)

        const createdPrivate = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(createdPrivate.length).toBeGreaterThan(0)

        const api = yield* _(NodeTestingApp)
        yield* _(
          api.deleteOffer(
            {query: {adminIds: [offer1.adminId, offer2.adminId]}},
            HttpClientRequest.setHeaders(authHeaders)
          )
        )

        const removedPublic = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(removedPublic.length).toEqual(0)

        const removedPrivate = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(removedPrivate.length).toEqual(0)

        const notRemovedPublic = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer3.offerId, offer4.offerId])}
        `)
        expect(notRemovedPublic.length).toEqual(2)

        const notRemovedPrivate = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer3.offerId, offer4.offerId])}
        `)
        expect(notRemovedPrivate.length).toEqual(6)
      })
    )
  })
  it('Does not fail when deleting offers using empty adminIds', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = generatePrivateKey()
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        const api = yield* _(NodeTestingApp)
        yield* _(
          api.deleteOffer(
            {query: {adminIds: []}},
            HttpClientRequest.setHeaders(authHeaders)
          )
        )
      })
    )
  })
  it('Does not fail when deleting non existing offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = generatePrivateKey()
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        const offer1 = yield* _(createOffer(authHeaders))
        const offer2 = yield* _(createOffer(authHeaders))

        const sql = yield* _(SqlClient.SqlClient)
        const createdPublic = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(createdPublic.length).toBeGreaterThan(0)

        const createdPrivate = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(createdPrivate.length).toBeGreaterThan(0)

        const api = yield* _(NodeTestingApp)
        yield* _(
          api.deleteOffer(
            {
              query: {
                adminIds: [offer1.adminId, offer2.adminId, generateAdminId()],
              },
            },
            HttpClientRequest.setHeaders(authHeaders)
          )
        )

        const removedPublic = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(removedPublic.length).toEqual(0)

        const removedPrivate = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
            LEFT JOIN offer_public ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.in('offer_public.offer_id', [offer1.offerId, offer2.offerId])}
        `)
        expect(removedPrivate.length).toEqual(0)
      })
    )
  })
})

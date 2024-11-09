/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import {
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../runPromiseInMockedEnvironment'

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const me = generatePrivateKey()
let offer1: CreateNewOfferResponse

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },

          {
            payloadPrivate:
              'offer1payloadPrivateForMe' as PrivatePayloadEncrypted,
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
    })
  )
})

describe('Refresh offer', () => {
  it('Refreshes offer', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = now() - interval '1 day'
          WHERE
            id = ${offer1.id}
        `)

        const client = yield* _(NodeTestingApp)
        yield* _(
          client.refreshOffer(
            {
              body: {
                adminIds: [offer1.adminId],
              },
            },
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

        const refreshsedOffers = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
            AND refreshed_at = now()::date
        `)
        expect(refreshsedOffers.length).toBe(1)
      })
    )
  })
  it('Fails with 404 when refreshing not existing offer', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const result = yield* _(
          client.refreshOffer(
            {
              body: {
                adminIds: [generateAdminId()],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          ),
          Effect.either
        )
        expect(result._tag).toBe('Left')
        if (result._tag === 'Left') {
          expect(result.left).toHaveProperty('status', 404)
        }
      })
    )
  })
})

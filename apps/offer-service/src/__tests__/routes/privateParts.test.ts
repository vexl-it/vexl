/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  PrivatePayloadEncryptedE,
  generateAdminId,
  newOfferId,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {
  CanNotDeletePrivatePartOfAuthor,
  DuplicatedPublicKeyError,
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {makeTestCommonAndSecurityHeaders} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const me = generatePrivateKey()
let offer1: CreateNewOfferResponse
let commonAndSecurityHeaders: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>

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

      const authHeaders = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })
      )

      yield* _(setAuthHeaders(authHeaders))

      commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(authHeaders)

      offer1 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request1,
            headers: commonAndSecurityHeaders,
          })
        )),
        adminId: request1.adminId,
      }
    })
  )
})

describe('Create private part', () => {
  it('Creates private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )
        const userPublicKey = generatePrivateKey().publicKeyPemBase64

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                publicKey: me.publicKeyPemBase64,
              })
            )
          )
        )

        yield* _(
          client.createPrivatePart({
            payload: {
              adminId: offer1.adminId,
              offerPrivateList: [
                {
                  payloadPrivate,
                  userPublicKey,
                },
              ],
            },
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const privatePartInDb = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            user_public_key = ${userPublicKey}
            AND payload_private = ${payloadPrivate}
        `)

        expect(privatePartInDb.at(0)).toBeTruthy()
      })
    )
  })

  it('Returns proper error when trying to create with duplicates', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )
        const userPublicKey = generatePrivateKey().publicKeyPemBase64

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                publicKey: me.publicKeyPemBase64,
              })
            )
          )
        )

        const result = yield* _(
          client.createPrivatePart({
            payload: {
              adminId: offer1.adminId,
              offerPrivateList: [
                {
                  payloadPrivate,
                  userPublicKey,
                },
                {
                  payloadPrivate,
                  userPublicKey,
                },
              ],
            },
          }),
          Effect.either
        )

        expectErrorResponse(DuplicatedPublicKeyError)(result)
      })
    )
  })

  it('Removes old private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                publicKey: me.publicKeyPemBase64,
              })
            )
          )
        )

        yield* _(
          client.createPrivatePart({
            payload: {
              adminId: offer1.adminId,
              offerPrivateList: [
                {
                  payloadPrivate,
                  userPublicKey: user1.publicKeyPemBase64,
                },
              ],
            },
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const privatePartInDb = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            user_public_key = ${user1.publicKeyPemBase64}
            AND payload_private = ${payloadPrivate}
        `)

        expect(privatePartInDb.at(0)).toBeTruthy()
      })
    )
  })

  it('Does fail with not found when trying to add private part to offer that does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                publicKey: me.publicKeyPemBase64,
              })
            )
          )
        )

        const result = yield* _(
          client.createPrivatePart({
            payload: {
              adminId: generateAdminId(),
              offerPrivateList: [
                {
                  payloadPrivate,
                  userPublicKey: user1.publicKeyPemBase64,
                },
              ],
            },
          }),
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

describe('Delete private part', () => {
  it('Deletes private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                publicKey: me.publicKeyPemBase64,
              })
            )
          )
        )

        yield* _(
          client.deletePrivatePart({
            payload: {
              adminIds: [offer1.adminId],
              publicKeys: [user1.publicKeyPemBase64],
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const result = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            user_public_key = ${user1.publicKeyPemBase64}
            AND payload_private = 'offer1payloadPrivate'
        `)
        expect(result.at(0)).toBeFalsy()
      })
    )
  })

  it('Can not delete private part for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.deletePrivatePart({
            payload: {
              adminIds: [offer1.adminId],
              publicKeys: [me.publicKeyPemBase64],
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(CanNotDeletePrivatePartOfAuthor)(response)
      })
    )
  })
})

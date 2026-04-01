import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  PrivatePayloadEncrypted,
  generateAdminId,
  newOfferId,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
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
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },
          {
            payloadPrivate:
              '0offer1payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      const authHeaders = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncrypted)(
          '0addedPrivatePayload'
        )
        const userPublicKey = generatePrivateKey().publicKeyPemBase64

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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

  it('Does not update offer modified_at or public_part_version when creating private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncrypted)(
          '0addedPrivatePayloadWithModifiedAt'
        )
        const userPublicKey = (yield* _(generateV2KeyPair())).publicKey

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = CURRENT_DATE - INTERVAL '2 day'
          WHERE
            offer_id = ${offer1.offerId}
        `)
        const initialStateResult = yield* _(sql`
          SELECT
            modified_at = CURRENT_DATE - INTERVAL '2 day' AS "isOriginalDate",
            public_part_version AS "publicPartVersion"
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)
        const initialVersion = initialStateResult.at(0)?.publicPartVersion

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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

        const modifiedAtResult = yield* _(sql`
          SELECT
            modified_at = CURRENT_DATE - INTERVAL '2 day' AS "isOriginalDate",
            public_part_version = ${initialVersion} AS "isVersionUnchanged"
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)

        expect(initialStateResult.at(0)?.isOriginalDate).toBe(true)
        expect(modifiedAtResult.at(0)?.isOriginalDate).toBe(true)
        expect(modifiedAtResult.at(0)?.isVersionUnchanged).toBe(true)
      })
    )
  })

  it('Returns proper error when trying to create with duplicates', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncrypted)(
          '0addedPrivatePayload'
        )
        const userPublicKey = generatePrivateKey().publicKeyPemBase64

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncrypted)(
          '0addedPrivatePayload'
        )

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncrypted)(
          '0addedPrivatePayload'
        )

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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

  it('Does not update offer modified_at or public_part_version when deleting private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = CURRENT_DATE - INTERVAL '2 day'
          WHERE
            offer_id = ${offer1.offerId}
        `)

        const initialStateResult = yield* _(sql`
          SELECT
            modified_at = CURRENT_DATE - INTERVAL '2 day' AS "isOriginalDate",
            public_part_version AS "publicPartVersion"
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)
        const initialVersion = initialStateResult.at(0)?.publicPartVersion

        yield* _(
          setAuthHeaders(
            yield* _(
              createDummyAuthHeadersForUser({
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
                publicKey: me.publicKeyPemBase64,
              })
            )
          )
        )

        yield* _(
          client.deletePrivatePart({
            payload: {
              adminIds: [offer1.adminId],
              publicKeys: [user2.publicKeyPemBase64],
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const updatedResult = yield* _(sql`
          SELECT
            modified_at = CURRENT_DATE - INTERVAL '2 day' AS "isOriginalDate",
            public_part_version = ${initialVersion} AS "isVersionUnchanged"
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)

        expect(initialStateResult.at(0)?.isOriginalDate).toBe(true)
        expect(updatedResult.at(0)?.isOriginalDate).toBe(true)
        expect(updatedResult.at(0)?.isVersionUnchanged).toBe(true)
      })
    )
  })

  it('Can not delete private part for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
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

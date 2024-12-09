import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  RequestNotPendingError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Schema} from 'effect'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM inbox`)
      yield* _(sql`DELETE FROM message`)
      yield* _(sql`DELETE FROM white_list`)

      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
      const client = yield* _(NodeTestingApp)

      yield* _(
        client.requestApproval(
          {
            body: {
              message: 'someMessage',
              publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
            },
          },
          HttpClientRequest.setHeaders(user1.authHeaders)
        )
      )

      yield* _(sql`DELETE FROM message`)
    })
  )
})

describe('Cancel request', () => {
  it('Cancel request and send request message to the one who received the request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.cancelRequestApproval(
            {
              body: {
                message: 'cancelMessage',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const messages = yield* _(
          client.retrieveMessages(
            {
              body: yield* _(user2.inbox1.addChallenge({})),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) IOS',
              }),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        expect(messages.messages[0]?.message).toBe('cancelMessage')
      })
    )
  })

  describe('fail when', () => {
    it('Request not fonud', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          const failedReqResponse = yield* _(
            client.cancelRequestApproval(
              {
                body: {
                  message: 'cancelMessage',
                  publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                },
              },
              HttpClientRequest.setHeaders(user1.authHeaders)
            ),
            Effect.either
          )

          expectErrorResponse(RequestNotPendingError)(failedReqResponse)
        })
      )
    })

    it('Request is approved', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(
            client.approveRequest(
              {
                body: yield* _(
                  user2.inbox1.addChallenge({
                    publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                    approve: true,
                    message: 'approve',
                  })
                ),
              },
              HttpClientRequest.setHeaders(user2.authHeaders)
            )
          )

          const failedReqResponse = yield* _(
            client.cancelRequestApproval(
              {
                body: {
                  message: 'cancelMessage',
                  publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                },
              },
              HttpClientRequest.setHeaders(user1.authHeaders)
            ),
            Effect.either
          )

          expectErrorResponse(RequestNotPendingError)(failedReqResponse)
        })
      )
    })

    it('Request is disaproved', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(
            client.approveRequest(
              {
                body: yield* _(
                  user2.inbox1.addChallenge({
                    publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                    approve: false,
                    message: 'approve',
                  })
                ),
              },
              HttpClientRequest.setHeaders(user2.authHeaders)
            )
          )

          const failedReqResponse = yield* _(
            client.cancelRequestApproval(
              {
                body: {
                  message: 'cancelMessage',
                  publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                },
              },
              HttpClientRequest.setHeaders(user1.authHeaders)
            ),
            Effect.either
          )

          expectErrorResponse(RequestNotPendingError)(failedReqResponse)
        })
      )
    })

    it('sender inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          const dummyAuthHeaders = yield* _(
            createDummyAuthHeadersForUser({
              publicKey: generatePrivateKey().publicKeyPemBase64,
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333337'),
            })
          )

          const failedReqResponse = yield* _(
            client.cancelRequestApproval(
              {
                body: {
                  message: 'cancelMessage',
                  publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                },
              },
              HttpClientRequest.setHeaders(dummyAuthHeaders)
            ),
            Effect.either
          )
          expectErrorResponse(SenderInboxDoesNotExistError)(failedReqResponse)
        })
      )
    })

    it('receiver inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          const failedReqResponse = yield* _(
            client.cancelRequestApproval(
              {
                body: {
                  message: 'cancelMessage',
                  publicKey: generatePrivateKey().publicKeyPemBase64,
                },
              },
              HttpClientRequest.setHeaders(user1.authHeaders)
            ),
            Effect.either
          )
          expectErrorResponse(ReceiverInboxDoesNotExistError)(failedReqResponse)
        })
      )
    })
  })
})

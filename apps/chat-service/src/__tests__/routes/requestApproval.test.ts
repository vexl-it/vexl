import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  RequestMessagingNotAllowedError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect} from 'effect'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      // Clear database before each to start fresh
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM inbox`)
      yield* _(sql`DELETE FROM message`)
      yield* _(sql`DELETE FROM white_list`)

      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
    })
  )
})

describe('Request approval', () => {
  it('Request approval sends an message to the other side', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const messagesForUser2 = yield* _(
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

        expect(messagesForUser2.messages).toHaveLength(1)
        expect(messagesForUser2.messages[0]).toHaveProperty(
          'message',
          'request message'
        )
      })
    )
  })

  it('Can not request approval twice in a row', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('Can request approval twice within timeout interval', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE white_list
          SET
            date = NOW() - INTERVAL '1 day'
        `)

        const toNotFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expect(toNotFail._tag).toBe('Right')

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('Cannot send request when already approved', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        yield* _(
          client.approveRequest(
            {
              body: yield* _(
                user2.inbox1.addChallenge({
                  message: 'approval message',
                  approve: true,
                  publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                })
              ),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('Cannot send request when already disaproved', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        yield* _(
          client.approveRequest(
            {
              body: yield* _(
                user2.inbox1.addChallenge({
                  message: 'approval message',
                  approve: false,
                  publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                })
              ),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('Cannot send request when the other side blocked', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        yield* _(
          client.blockInboxEndpoint(
            {
              body: yield* _(
                user2.inbox1.addChallenge({
                  publicKeyToBlock: user1.mainKeyPair.publicKeyPemBase64,
                })
              ),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('Cannot send request right after cancelation', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        yield* _(
          client.cancelRequestApproval(
            {
              body: {
                message: 'cancel message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('can send request after cancelation when request timeout period has passed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        yield* _(
          client.cancelRequestApproval(
            {
              body: {
                message: 'cancel message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE white_list
          SET
            date = NOW() - INTERVAL '1 day'
        `)

        const toNotFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )

        expect(toNotFail._tag).toBe('Right')

        const toFail = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(RequestMessagingNotAllowedError)(toFail)
      })
    )
  })

  it('Returns error when sending request to non existing inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const failedResponse = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: generatePrivateKey().publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(failedResponse)
      })
    )
  })

  it('Returns error when sending request from non existing inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const failedResponse = yield* _(
          client.requestApproval(
            {
              body: {
                message: 'request message',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333332'),
                  publicKey: generatePrivateKey().publicKeyPemBase64,
                })
              )
            )
          ),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(failedResponse)
      })
    )
  })
})

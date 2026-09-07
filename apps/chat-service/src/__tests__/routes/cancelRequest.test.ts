import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  commonHeaders,
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM inbox`
      yield* sql`DELETE FROM message`

      user1 = yield* createMockedUser('+420733333330')
      user2 = yield* createMockedUser('+420733333331')
      const client = yield* NodeTestingApp

      yield* setAuthHeaders(user1.authHeaders)

      const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        user1.authHeaders
      )

      yield* client.Inboxes.requestApproval({
        payload: {
          message: 'someMessage' as MessageCypher,
          publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
        },
        headers: commonAndSecurityHeaders,
      })

      yield* sql`DELETE FROM message`
    })
  )
})

describe('Cancel request', () => {
  it('Cancel request and send request message to the one who received the request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user1.authHeaders)

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user1.authHeaders
        )

        yield* client.Inboxes.cancelRequestApproval({
          payload: {
            message: 'cancelMessage' as MessageCypher,
            publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          },
          headers: commonAndSecurityHeaders,
        })

        yield* setAuthHeaders(user2.authHeaders)
        const messages = yield* client.Messages.retrieveMessages({
          payload: yield* user2.inbox1.addChallenge({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })

        expect(messages.messages[0]?.message).toBe('cancelMessage')
      })
    )
  })

  describe('succeeds without whitelist state', () => {
    it('when a request was not found', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user1.authHeaders)

          const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
            user1.authHeaders
          )

          const failedReqResponse = yield* pipe(
            client.Inboxes.cancelRequestApproval({
              payload: {
                message: 'cancelMessage' as MessageCypher,
                publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              },
              headers: commonAndSecurityHeaders,
            }),
            Effect.result
          )

          expect(failedReqResponse._tag).toBe('Success')
        })
      )
    })

    it('when a request was approved', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          yield* client.Inboxes.approveRequest({
            headers: commonHeaders,
            payload: yield* user2.inbox1.addChallenge({
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: true,
              message: 'approve' as MessageCypher,
            }),
          })

          yield* setAuthHeaders(user1.authHeaders)

          const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
            user1.authHeaders
          )

          const failedReqResponse = yield* pipe(
            client.Inboxes.cancelRequestApproval({
              payload: {
                message: 'cancelMessage' as MessageCypher,
                publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              },
              headers: commonAndSecurityHeaders,
            }),
            Effect.result
          )

          expect(failedReqResponse._tag).toBe('Success')
        })
      )
    })

    it('when a request was disapproved', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          yield* client.Inboxes.approveRequest({
            headers: commonHeaders,
            payload: yield* user2.inbox1.addChallenge({
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: false,
              message: 'approve' as MessageCypher,
            }),
          })

          yield* setAuthHeaders(user1.authHeaders)

          const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
            user1.authHeaders
          )

          const failedReqResponse = yield* pipe(
            client.Inboxes.cancelRequestApproval({
              payload: {
                message: 'cancelMessage' as MessageCypher,
                publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              },
              headers: commonAndSecurityHeaders,
            }),
            Effect.result
          )

          expect(failedReqResponse._tag).toBe('Success')
        })
      )
    })

    it('sender inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          const dummyAuthHeaders = yield* createDummyAuthHeadersForUser({
            publicKey: generatePrivateKey().publicKeyPemBase64,
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333337'),
          })

          yield* setAuthHeaders(dummyAuthHeaders)

          const commonAndSecurityHeaders =
            makeTestCommonAndSecurityHeaders(dummyAuthHeaders)

          const failedReqResponse = yield* pipe(
            client.Inboxes.cancelRequestApproval({
              payload: {
                message: 'cancelMessage' as MessageCypher,
                publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              },
              headers: commonAndSecurityHeaders,
            }),
            Effect.result
          )
          expectErrorResponse(SenderInboxDoesNotExistError)(failedReqResponse)
        })
      )
    })

    it('receiver inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user1.authHeaders)

          const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
            user1.authHeaders
          )

          const failedReqResponse = yield* pipe(
            client.Inboxes.cancelRequestApproval({
              payload: {
                message: 'cancelMessage' as MessageCypher,
                publicKey: generatePrivateKey().publicKeyPemBase64,
              },
              headers: commonAndSecurityHeaders,
            }),
            Effect.result
          )
          expectErrorResponse(ReceiverInboxDoesNotExistError)(failedReqResponse)
        })
      )
    })
  })
})

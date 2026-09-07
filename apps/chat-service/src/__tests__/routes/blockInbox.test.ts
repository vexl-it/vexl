import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
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

      yield* setAuthHeaders(user2.authHeaders)
      yield* client.Inboxes.approveRequest({
        headers: commonHeaders,
        payload: yield* user2.inbox1.addChallenge({
          message: 'someMessage2' as MessageCypher,
          publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
          approve: true,
        }),
      })

      yield* sql`DELETE FROM message`
    })
  )
})

describe('Block inbox', () => {
  it('accepts messages after blocking because filtering is client-side', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user2.authHeaders)
        yield* client.Inboxes.blockInbox({
          payload: yield* user2.inbox1.addChallenge({
            publicKeyToBlock: user1.mainKeyPair.publicKeyPemBase64,
          }),
        })

        yield* setAuthHeaders(user1.authHeaders)
        const response = yield* pipe(
          client.Messages.sendMessage({
            headers: commonHeaders,
            payload: (yield* user1.addChallengeForMainInbox({
              message: 'someMessage' as MessageCypher,
              messageType: 'MESSAGE' as const,
              receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
            })) satisfies SendMessageRequest,
          }),
          Effect.result
        )

        expect(response._tag).toBe('Success')
      })
    )
  })

  it('throws an error when receiver inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user2.authHeaders)
        const shouldBeRejectedResponse = yield* pipe(
          client.Inboxes.blockInbox({
            payload: yield* addChallengeForKey(
              generatePrivateKey(),
              user2.authHeaders
            )({
              publicKeyToBlock: user1.mainKeyPair.publicKeyPemBase64,
            }),
          }),
          Effect.result
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(
          shouldBeRejectedResponse
        )
      })
    )
  })

  it('throws an error when sender inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user2.authHeaders)
        const shouldBeRejectedResponse = yield* pipe(
          client.Inboxes.blockInbox({
            payload: yield* user2.inbox1.addChallenge({
              publicKeyToBlock: generatePrivateKey().publicKeyPemBase64,
            }),
          }),
          Effect.result
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(
          shouldBeRejectedResponse
        )
      })
    )
  })
})

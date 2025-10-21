import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {NotPermittedToSendMessageToTargetInboxError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
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

      yield* _(setAuthHeaders(user1.authHeaders))
      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          },
        })
      )

      yield* _(setAuthHeaders(user2.authHeaders))
      yield* _(
        client.Inboxes.approveRequest({
          payload: yield* _(
            user2.inbox1.addChallenge({
              message: 'someMessage2',
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )

      yield* _(sql`DELETE FROM message`)
    })
  )
})

describe('Block inbox', () => {
  it('Block inbox of user1 as user2, messages should not be possible to sent after that', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.blockInbox({
            payload: yield* _(
              user2.inbox1.addChallenge({
                publicKeyToBlock: user1.mainKeyPair.publicKeyPemBase64,
              })
            ),
          })
        )

        yield* _(setAuthHeaders(user1.authHeaders))
        const shouldBeRejectedResponse = yield* _(
          client.Messages.sendMessage({
            payload: (yield* _(
              user1.addChallengeForMainInbox({
                message: 'someMessage',
                messageType: 'MESSAGE' as const,
                receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              })
            )) satisfies SendMessageRequest,
          }),
          Effect.either
        )

        expectErrorResponse(NotPermittedToSendMessageToTargetInboxError)(
          shouldBeRejectedResponse
        )
      })
    )
  })

  it('throws an error when receiver inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        const shouldBeRejectedResponse = yield* _(
          client.Inboxes.blockInbox({
            payload: yield* _(
              addChallengeForKey(
                generatePrivateKey(),
                user2.authHeaders
              )({
                publicKeyToBlock: user1.mainKeyPair.publicKeyPemBase64,
              })
            ),
          }),
          Effect.either
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(
          shouldBeRejectedResponse
        )
      })
    )
  })

  it('throws an error when sender inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        const shouldBeRejectedResponse = yield* _(
          client.Inboxes.blockInbox({
            payload: yield* _(
              user2.inbox1.addChallenge({
                publicKeyToBlock: generatePrivateKey().publicKeyPemBase64,
              })
            ),
          }),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(
          shouldBeRejectedResponse
        )
      })
    )
  })
})

import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  RequestNotPendingError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
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
        client.Inboxes.requestApprovalV2({
          payload: yield* _(
            user1.inbox1.addChallenge({
              receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              message: 'cancelMessage' as MessageCypher,
            })
          ),
        })
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

        yield* _(setAuthHeaders(user1.authHeaders))
        yield* _(
          client.Inboxes.cancelRequestApprovalV2({
            payload: yield* _(
              user1.inbox1.addChallenge({
                receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                message: 'cancelMessage' as MessageCypher,
              })
            ),
          })
        )

        yield* _(setAuthHeaders(user2.authHeaders))
        const messages = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user2.inbox1.addChallenge({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
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

          yield* _(setAuthHeaders(user1.authHeaders))
          const failedReqResponse = yield* _(
            client.Inboxes.cancelRequestApprovalV2({
              payload: yield* _(
                user1.inbox1.addChallenge({
                  receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                  message: 'cancelMessage' as MessageCypher,
                })
              ),
            }),
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

          yield* _(setAuthHeaders(user2.authHeaders))
          yield* _(
            client.Inboxes.approveRequest({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  publicKeyToConfirm: user1.inbox1.keyPair.publicKeyPemBase64,
                  approve: true,
                  message: 'approve' as MessageCypher,
                })
              ),
            })
          )

          yield* _(setAuthHeaders(user1.authHeaders))
          const failedReqResponse = yield* _(
            client.Inboxes.cancelRequestApprovalV2({
              payload: yield* _(
                user1.inbox1.addChallenge({
                  receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                  message: 'cancelMessage' as MessageCypher,
                })
              ),
            }),
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

          yield* _(setAuthHeaders(user2.authHeaders))
          yield* _(
            client.Inboxes.approveRequest({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  publicKeyToConfirm: user1.inbox1.keyPair.publicKeyPemBase64,
                  approve: false,
                  message: 'approve' as MessageCypher,
                })
              ),
            })
          )

          yield* _(setAuthHeaders(user1.authHeaders))
          const failedReqResponse = yield* _(
            client.Inboxes.cancelRequestApprovalV2({
              payload: yield* _(
                user1.inbox1.addChallenge({
                  receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                  message: 'cancelMessage' as MessageCypher,
                })
              ),
            }),
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

          const dummyKeyPair = generatePrivateKey()
          const dummyAuthHeaders = yield* _(
            createDummyAuthHeadersForUser({
              publicKey: dummyKeyPair.publicKeyPemBase64,
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333337'),
            })
          )

          yield* _(setAuthHeaders(dummyAuthHeaders))
          const failedReqResponse = yield* _(
            client.Inboxes.cancelRequestApprovalV2({
              payload: yield* _(
                addChallengeForKey(
                  dummyKeyPair,
                  dummyAuthHeaders
                )({
                  receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
                  message: 'cancelMessage' as MessageCypher,
                })
              ),
            }),
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

          yield* _(setAuthHeaders(user1.authHeaders))
          const failedReqResponse = yield* _(
            client.Inboxes.cancelRequestApprovalV2({
              payload: yield* _(
                user1.inbox1.addChallenge({
                  receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
                  message: 'cancelMessage' as MessageCypher,
                })
              ),
            }),
            Effect.either
          )
          expectErrorResponse(ReceiverInboxDoesNotExistError)(failedReqResponse)
        })
      )
    })
  })
})

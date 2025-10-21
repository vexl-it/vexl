import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  RequestCancelledError,
  RequestNotFoundError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
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
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          },
        })
      )
    })
  )
})

// Expecting user1 mainKey to be approved by user2.inbox1

describe('Approve request', () => {
  it('Request can be approved when it is pending - the message is sent to requester after', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.approveRequest({
            payload: yield* _(
              user2.inbox1.addChallenge({
                message: 'acceptMessage',
                publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                approve: true,
              })
            ),
          })
        )

        yield* _(setAuthHeaders(user1.authHeaders))
        const messages = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(messages.messages[0].message).toBe('acceptMessage')

        const sendingMessagesToEachOtherRequests = yield* _(
          Effect.all([
            Effect.gen(function* (_) {
              yield* _(setAuthHeaders(user2.authHeaders))
              return yield* _(
                client.Messages.sendMessage({
                  payload: yield* _(
                    user2.inbox1.addChallenge({
                      message: 'someOtherMessage',
                      receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                      messageType: 'MESSAGE' as const,
                    })
                  ),
                })
              )
            }),

            Effect.gen(function* (_) {
              yield* _(setAuthHeaders(user1.authHeaders))
              return yield* _(
                client.Messages.sendMessage({
                  payload: yield* _(
                    user1.addChallengeForMainInbox({
                      message: 'someOtherMessage2',
                      receiverPublicKey:
                        user2.inbox1.keyPair.publicKeyPemBase64,
                      messageType: 'MESSAGE' as const,
                    })
                  ),
                })
              )
            }),
          ]),
          Effect.either
        )
        expect(sendingMessagesToEachOtherRequests._tag).toBe('Right')
      })
    )
  })

  it('Request can be disaproved when it is pending - the message is sent to requester after', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.approveRequest({
            payload: yield* _(
              user2.inbox1.addChallenge({
                message: 'disapproveMessage',
                publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                approve: false,
              })
            ),
          })
        )

        yield* _(setAuthHeaders(user1.authHeaders))
        const messages = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(messages.messages[0].message).toBe('disapproveMessage')

        const sendingMessagesToEachOtherRequests = yield* _(
          Effect.all([
            Effect.gen(function* (_) {
              yield* _(setAuthHeaders(user2.authHeaders))
              return yield* _(
                client.Messages.sendMessage({
                  payload: yield* _(
                    user2.inbox1.addChallenge({
                      message: 'someOtherMessage',
                      receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                      messageType: 'MESSAGE' as const,
                    })
                  ),
                }),
                Effect.either
              )
            }),

            Effect.gen(function* (_) {
              yield* _(setAuthHeaders(user1.authHeaders))
              return yield* _(
                client.Messages.sendMessage({
                  payload: yield* _(
                    user1.addChallengeForMainInbox({
                      message: 'someOtherMessage2',
                      receiverPublicKey:
                        user2.inbox1.keyPair.publicKeyPemBase64,
                      messageType: 'MESSAGE' as const,
                    })
                  ),
                }),
                Effect.either
              )
            }),
          ])
        )

        console.log(sendingMessagesToEachOtherRequests)
        expect(
          sendingMessagesToEachOtherRequests.map((one) => one._tag).join(', ')
        ).toBe('Left, Left')
      })
    )
  })

  describe('Request can not be approved when it is', () => {
    it('canceled', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user1.authHeaders))
          yield* _(
            client.Inboxes.cancelRequestApproval({
              payload: {
                message: 'someMessage2',
                publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              },
            })
          )

          yield* _(setAuthHeaders(user2.authHeaders))
          const errorResponse = yield* _(
            client.Inboxes.approveRequest({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  message: 'acceptMessage',
                  publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                  approve: true,
                })
              ),
            }),
            Effect.either
          )
          expectErrorResponse(RequestCancelledError)(errorResponse)
        })
      )
    })

    it('not found', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user2.authHeaders))
          const errorResponse = yield* _(
            client.Inboxes.approveRequest({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  message: 'acceptMessage',
                  publicKeyToConfirm: user1.inbox1.keyPair.publicKeyPemBase64,
                  approve: true,
                })
              ),
            }),
            Effect.either
          )
          expectErrorResponse(RequestNotFoundError)(errorResponse)
        })
      )
    })

    it('Sender inbox is not found', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user2.authHeaders))
          const errorResponse = yield* _(
            client.Inboxes.approveRequest({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  message: 'acceptMessage',
                  publicKeyToConfirm: generatePrivateKey().publicKeyPemBase64,
                  approve: true,
                })
              ),
            }),
            Effect.either
          )
          expectErrorResponse(SenderInboxDoesNotExistError)(errorResponse)
        })
      )
    })

    it('receiver inbox is not found', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user2.authHeaders))
          const errorResponse = yield* _(
            client.Inboxes.approveRequest({
              payload: yield* _(
                addChallengeForKey(
                  generatePrivateKey(),
                  user1.authHeaders
                )({
                  message: 'acceptMessage',
                  publicKeyToConfirm: user2.inbox1.keyPair.publicKeyPemBase64,
                  approve: true,
                })
              ),
            }),
            Effect.either
          )
          expectErrorResponse(ReceiverInboxDoesNotExistError)(errorResponse)
        })
      )
    })
  })
})

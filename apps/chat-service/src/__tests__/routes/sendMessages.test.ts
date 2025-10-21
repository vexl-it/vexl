import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ForbiddenMessageTypeError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser
let user3: MockedUser

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
      user3 = yield* _(createMockedUser('+420733333332'))
      const client = yield* _(NodeTestingApp)

      // user1 -> user2.inbox1
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

      // user1 -> user2.inbox2
      yield* _(setAuthHeaders(user1.authHeaders))
      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          },
        })
      )

      yield* _(setAuthHeaders(user2.authHeaders))
      yield* _(
        client.Inboxes.approveRequest({
          payload: yield* _(
            user2.inbox2.addChallenge({
              message: 'someMessage2',
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )

      // user3 -> user2.inbox1
      yield* _(setAuthHeaders(user3.authHeaders))
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
              publicKeyToConfirm: user3.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )

      // user3 -> user2.inbox2
      yield* _(setAuthHeaders(user3.authHeaders))
      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          },
        })
      )

      yield* _(setAuthHeaders(user2.authHeaders))
      yield* _(
        client.Inboxes.approveRequest({
          payload: yield* _(
            user2.inbox2.addChallenge({
              message: 'someMessage2',
              publicKeyToConfirm: user3.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )
      yield* _(sql`DELETE FROM message`)
    })
  )
})

describe('Send messages', () => {
  it('Sends messages to multiple inboxes', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messagesToSend = [
          yield* _(
            user2.inbox1.addChallenge({
              senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  message: '1fromUser2inbox1',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '2fromUser2inbox1',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
          yield* _(
            user2.inbox2.addChallenge({
              senderPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  message: '3fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '4fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
        ]

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Messages.sendMessages({
            payload: {data: messagesToSend},
          })
        )

        yield* _(setAuthHeaders(user1.authHeaders))
        const messagesReceivedByUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )
        expect(
          messagesReceivedByUser1.messages.map((one) => one.message)
        ).toEqual(['1fromUser2inbox1', '3fromUser2inbox2'])

        yield* _(setAuthHeaders(user3.authHeaders))
        const messagesReceivedByUser3 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user3.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(
          messagesReceivedByUser3.messages.map((one) => one.message)
        ).toEqual(['2fromUser2inbox1', '4fromUser2inbox2'])
      })
    )
  })

  it('Throws correct error when Receiver inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messagesToSend = [
          yield* _(
            user2.inbox1.addChallenge({
              senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  message: '1fromUser2inbox1',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '2fromUser2inbox1',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
          yield* _(
            user2.inbox2.addChallenge({
              senderPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
                  message: '3fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '4fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
        ]

        yield* _(setAuthHeaders(user2.authHeaders))
        const errorResponse = yield* _(
          client.Messages.sendMessages({
            payload: {data: messagesToSend},
          }),
          Effect.either
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(errorResponse)

        yield* _(setAuthHeaders(user1.authHeaders))
        const messagesReceivedByUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )
        expect(
          messagesReceivedByUser1.messages.map((one) => one.message)
        ).toEqual([])

        yield* _(setAuthHeaders(user3.authHeaders))
        const messagesReceivedByUser3 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user3.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(
          messagesReceivedByUser3.messages.map((one) => one.message)
        ).toEqual([])
      })
    )
  })

  it('Throws correct error when sender inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const nonExistingPrivKey = generatePrivateKey()
        const messagesToSend = [
          yield* _(
            user2.inbox1.addChallenge({
              senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  message: '1fromUser2inbox1',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '2fromUser2inbox1',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
          yield* _(
            user2.inbox2.addChallenge({
              senderPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  message: '3fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '4fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
          yield* _(
            addChallengeForKey(
              nonExistingPrivKey,
              user2.authHeaders
            )({
              senderPublicKey: nonExistingPrivKey.publicKeyPemBase64,
              messages: [
                {
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  message: '3fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
                {
                  receiverPublicKey: user3.mainKeyPair.publicKeyPemBase64,
                  message: '4fromUser2inbox2',
                  messageType: 'MESSAGE' as const,
                },
              ],
            })
          ),
        ]

        yield* _(setAuthHeaders(user2.authHeaders))
        const errorResponse = yield* _(
          client.Messages.sendMessages({
            payload: {data: messagesToSend},
          }),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(errorResponse)

        yield* _(setAuthHeaders(user1.authHeaders))
        const messagesReceivedByUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )
        expect(
          messagesReceivedByUser1.messages.map((one) => one.message)
        ).toEqual([])

        yield* _(setAuthHeaders(user3.authHeaders))

        const messagesReceivedByUser3 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user3.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(
          messagesReceivedByUser3.messages.map((one) => one.message)
        ).toEqual([])
      })
    )
  })

  it('Can not send message of type that is generated by BE', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        const errorResponse1 = yield* _(
          client.Messages.sendMessages({
            payload: {
              data: [
                yield* _(
                  user2.inbox1.addChallenge({
                    senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                    messages: [
                      {
                        receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                        message: '1fromUser2inbox1',
                        messageType: 'REQUEST_MESSAGING' as const,
                      },
                    ],
                  })
                ),
              ],
            },
          }),
          Effect.either
        )
        expectErrorResponse(ForbiddenMessageTypeError)(errorResponse1)

        const errorResponse2 = yield* _(
          client.Messages.sendMessages({
            payload: {
              data: [
                yield* _(
                  user2.inbox1.addChallenge({
                    senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                    messages: [
                      {
                        receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                        message: '1fromUser2inbox1',
                        messageType: 'APPROVE_MESSAGING' as const,
                      },
                    ],
                  })
                ),
              ],
            },
          }),
          Effect.either
        )
        expectErrorResponse(ForbiddenMessageTypeError)(errorResponse2)

        const errorResponse3 = yield* _(
          client.Messages.sendMessages({
            payload: {
              data: [
                yield* _(
                  user2.inbox1.addChallenge({
                    senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                    messages: [
                      {
                        receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                        message: '1fromUser2inbox1',
                        messageType: 'DISAPPROVE_MESSAGING' as const,
                      },
                    ],
                  })
                ),
              ],
            },
          }),
          Effect.either
        )
        expectErrorResponse(ForbiddenMessageTypeError)(errorResponse3)

        const errorResponse4 = yield* _(
          client.Messages.sendMessages({
            payload: {
              data: [
                yield* _(
                  user2.inbox1.addChallenge({
                    senderPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                    messages: [
                      {
                        receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                        message: '1fromUser2inbox1',
                        messageType: 'CANCEL_REQUEST_MESSAGING' as const,
                      },
                    ],
                  })
                ),
              ],
            },
          }),
          Effect.either
        )
        expectErrorResponse(ForbiddenMessageTypeError)(errorResponse4)
      })
    )
  })
})

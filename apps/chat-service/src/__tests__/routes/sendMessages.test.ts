import {HttpClientRequest} from '@effect/platform'
import {type SendMessageRequest} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect} from 'effect'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
    })
  )
})

describe('Send message', () => {
  it('Sends message from user1 to user2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.requestApproval(
            {
              body: {
                message: 'someMessage',
                publicKey: user1.mainKeyPair.publicKeyPemBase64,
              },
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )
        const messageToSend = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'someMessage',
            messageType: 'MESSAGE' as const,
            publicKey: user1.mainKeyPair.publicKeyPemBase64,
            receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(
          client.sendMessage(
            {
              body: messageToSend,
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const messagesReceived = yield* _(
          client.retrieveMessages(
            {
              body: yield* _(user2.inbox1.addChallenge({})),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        expect(messagesReceived.messages.length).toBe(1)
        expect(messagesReceived.messages[0].message).toBe('someMessage')

        const messagesReceived2 = yield* _(
          client.retrieveMessages(
            {
              body: yield* _(user2.inbox2.addChallenge({})),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        expect(messagesReceived2.messages.length).toBe(0)
      })
    )
  })
})

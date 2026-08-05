import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
  createMockedUser,
  type MockedUser,
} from '../utils/createMockedUser'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM inbox`)
      yield* _(sql`DELETE FROM message`)

      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
    })
  )
})

describe('Request approval V2', () => {
  it('delivers repeated request messages to the receiver', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(user1.authHeaders))

        yield* _(
          client.Inboxes.requestApprovalV2({
            headers: commonHeaders,
            payload: yield* _(
              user1.inbox1.addChallenge({
                receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                message: Schema.decodeSync(MessageCypher)('request message 1'),
              })
            ),
          })
        )
        yield* _(
          client.Inboxes.requestApprovalV2({
            headers: commonHeaders,
            payload: yield* _(
              user1.inbox1.addChallenge({
                receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                message: Schema.decodeSync(MessageCypher)('request message 2'),
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

        expect(messages.messages).toHaveLength(2)
        expect(messages.messages[0].message).toBe('request message 1')
        expect(messages.messages[1].message).toBe('request message 2')
      })
    )
  })

  it('returns an error when the receiver inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(user1.authHeaders))

        const response = yield* _(
          client.Inboxes.requestApprovalV2({
            headers: commonHeaders,
            payload: yield* _(
              user1.inbox1.addChallenge({
                message: Schema.decodeSync(MessageCypher)('request message'),
                receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
              })
            ),
          }),
          Effect.either
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(response)
      })
    )
  })

  it('returns an error when the sender inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const dummyKeyPair = generatePrivateKey()
        const dummyAuthHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333332'),
            publicKey: dummyKeyPair.publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(dummyAuthHeaders))

        const response = yield* _(
          client.Inboxes.requestApprovalV2({
            headers: commonHeaders,
            payload: yield* _(
              addChallengeForKey(
                dummyKeyPair,
                dummyAuthHeaders
              )({
                message: Schema.decodeSync(MessageCypher)('request message'),
                receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
              })
            ),
          }),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(response)
      })
    )
  })
})

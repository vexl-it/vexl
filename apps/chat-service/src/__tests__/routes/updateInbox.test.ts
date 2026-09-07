import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
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

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      user1 = yield* createMockedUser('+420733333330')
      user2 = yield* createMockedUser('+420733333331')
      const client = yield* NodeTestingApp

      yield* setAuthHeaders(user1.authHeaders)

      const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        user1.authHeaders
      )

      yield* client.Inboxes.requestApproval({
        payload: {
          message: 'cancelMessage' as MessageCypher,
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

      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM message`
    })
  )
})

describe('Update inbox', () => {
  it('Can be called sucessfully', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(user1.authHeaders)

        const reseponse = yield* pipe(
          client.Inboxes.updateInbox({
            payload: yield* user1.addChallengeForMainInbox({}),
          }),
          Effect.result
        )

        expect(reseponse).toMatchObject({_tag: 'Success'})
      })
    )
  })
})

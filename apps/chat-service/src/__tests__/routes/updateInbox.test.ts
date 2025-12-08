import {SqlClient} from '@effect/sql'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {
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
    Effect.gen(function* (_) {
      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
      const client = yield* _(NodeTestingApp)

      yield* _(setAuthHeaders(user1.authHeaders))

      const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        user1.authHeaders
      )

      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'cancelMessage' as MessageCypher,
            publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          },
          headers: commonAndSecurityHeaders,
        })
      )

      yield* _(setAuthHeaders(user2.authHeaders))
      yield* _(
        client.Inboxes.approveRequest({
          payload: yield* _(
            user2.inbox1.addChallenge({
              message: 'someMessage2' as MessageCypher,
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )

      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM message`)
    })
  )
})

describe('Update inbox', () => {
  it('Can be called sucessfully', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(user1.authHeaders))

        const reseponse = yield* _(
          client.Inboxes.updateInbox({
            payload: yield* _(user1.addChallengeForMainInbox({})),
          }),
          Effect.either
        )

        expect(reseponse).toMatchObject({_tag: 'Right'})
      })
    )
  })
})

import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
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
      const client = yield* _(NodeTestingApp)

      yield* _(
        client.requestApproval(
          {
            body: {
              message: 'someMessage',
              publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
            },
          },
          HttpClientRequest.setHeaders(user1.authHeaders)
        )
      )

      yield* _(
        client.approveRequest(
          {
            body: yield* _(
              user2.inbox1.addChallenge({
                message: 'someMessage2',
                publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                approve: true,
              })
            ),
          },
          HttpClientRequest.setHeaders(user2.authHeaders)
        )
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
        const reseponse = yield* _(
          client.updateInbox(
            {
              body: yield* _(user1.addChallengeForMainInbox({})),
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
          Effect.either
        )

        expect(reseponse).toMatchObject({_tag: 'Right'})
      })
    )
  })
})

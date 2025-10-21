import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
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
    })
  )
})

it('Create challenge works', async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      yield* _(setAuthHeaders(user1.authHeaders))
      yield* _(
        client.Challenges.createChallenge({
          payload: {
            publicKey: generatePrivateKey().publicKeyPemBase64,
          },
        })
      )

      const keysForBatch = [generatePrivateKey(), generatePrivateKey()] as const

      const batch = yield* _(
        client.Challenges.createChallengeBatch({
          payload: {
            publicKeys: [
              keysForBatch[0].publicKeyPemBase64,
              keysForBatch[1].publicKeyPemBase64,
            ],
          },
        })
      )

      expect(batch.challenges.map((c) => c.publicKey)).toEqual([
        keysForBatch[0].publicKeyPemBase64,
        keysForBatch[1].publicKeyPemBase64,
      ])
    })
  )
})

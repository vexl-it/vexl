import {HttpClientRequest} from '@effect/platform'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
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
    })
  )
})

it('Create challenge works', async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      yield* _(
        client.createChallenge(
          {
            body: {
              publicKey: generatePrivateKey().publicKeyPemBase64,
            },
          },
          HttpClientRequest.setHeaders(user1.authHeaders)
        )
      )

      const keysForBatch = [generatePrivateKey(), generatePrivateKey()] as const

      const batch = yield* _(
        client.createChallengeBatch(
          {
            body: {
              publicKeys: [
                keysForBatch[0].publicKeyPemBase64,
                keysForBatch[1].publicKeyPemBase64,
              ],
            },
          },
          HttpClientRequest.setHeaders(user1.authHeaders)
        )
      )

      expect(batch.challenges.map((c) => c.publicKey)).toEqual([
        keysForBatch[0].publicKeyPemBase64,
        keysForBatch[1].publicKeyPemBase64,
      ])
    })
  )
})

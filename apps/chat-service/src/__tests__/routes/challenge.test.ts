import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option} from 'effect'
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
    })
  )
})

it('Create challenge works', async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      const client = yield* NodeTestingApp

      yield* setAuthHeaders(user1.authHeaders)
      yield* client.Challenges.createChallenge({
        payload: {
          publicKey: generatePrivateKey().publicKeyPemBase64,
          publicKeyV2: Option.none(),
        },
      })

      const keysForBatch = [generatePrivateKey(), generatePrivateKey()] as const

      const batch = yield* client.Challenges.createChallengeBatch({
        payload: {
          publicKeys: [
            keysForBatch[0].publicKeyPemBase64,
            keysForBatch[1].publicKeyPemBase64,
          ],
        },
      })

      expect(batch.challenges.map((c) => c.publicKey)).toEqual([
        keysForBatch[0].publicKeyPemBase64,
        keysForBatch[1].publicKeyPemBase64,
      ])
    })
  )
})

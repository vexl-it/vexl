import {HttpClient, HttpClientRequest} from '@effect/platform'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {InvalidChallengeError} from '@vexl-next/rest-api/src/challenges/contracts'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  CHAT_IMAGE_MAX_BYTES,
  RequestChatImageUploadRequest,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Schema} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
  createMockedUser,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user: MockedUser

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user = yield* _(createMockedUser('+420733333340'))
    })
  )
})

describe('Chat images', () => {
  it('Returns a new image id with an upload url signed for the exact size', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const {imageId, uploadUrl} = yield* _(
          client.Images.requestChatImageUpload({
            headers: commonHeaders,
            payload: yield* _(
              user.inbox1.addChallenge({size: CHAT_IMAGE_MAX_BYTES})
            ),
          })
        )

        expect(uploadUrl).toContain(`key=${imageId}`)
        expect(uploadUrl).toContain(`contentLength=${CHAT_IMAGE_MAX_BYTES}`)
      })
    )
  })

  it('Rejects upload request with invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Images.requestChatImageUpload({
            headers: commonHeaders,
            payload: yield* _(user.inbox1.addChallenge({size: 16}, true)),
          }),
          Effect.either
        )

        expectErrorResponse(InvalidChallengeError)(response)
      })
    )
  })

  it('Rejects upload request from a sender without inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Images.requestChatImageUpload({
            headers: commonHeaders,
            payload: yield* _(
              addChallengeForKey(
                generatePrivateKey(),
                user.authHeaders
              )({size: 16})
            ),
          }),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(response)
      })
    )
  })

  it('Rejects upload request over the size limit', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const payload = yield* _(
          user.inbox1.addChallenge({size: 16}),
          Effect.flatMap(Schema.encode(RequestChatImageUploadRequest))
        )
        const httpClient = yield* _(HttpClient.HttpClient)

        const response = yield* _(
          HttpClientRequest.post('/api/v1/chat-images/upload').pipe(
            HttpClientRequest.setHeaders(
              Schema.encodeSync(CommonHeaders)(commonHeaders)
            ),
            HttpClientRequest.bodyUnsafeJson({
              ...payload,
              size: CHAT_IMAGE_MAX_BYTES + 1,
            }),
            httpClient.execute
          )
        )

        expect(response.status).toBe(400)
      })
    )
  })
})

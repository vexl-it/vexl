import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {ChatImageId} from '@vexl-next/domain/src/general/messaging'
import {InvalidChallengeError} from '@vexl-next/rest-api/src/challenges/contracts'
import {
  CHAT_IMAGE_MAX_BYTES,
  ChatImageNotFoundError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Schema} from 'effect'
import {randomBytes, randomUUID} from 'node:crypto'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
  createMockedUser,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user: MockedUser

const randomImageData = (bytes: number): string =>
  randomBytes(bytes).toString('base64')

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user = yield* _(createMockedUser('+420733333340'))
    })
  )
})

describe('Chat images', () => {
  it('Uploads an image of max size and downloads the same data', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const data = randomImageData(CHAT_IMAGE_MAX_BYTES)

        const {imageId} = yield* _(
          client.Images.uploadChatImage({
            headers: commonHeaders,
            payload: yield* _(user.inbox1.addChallenge({data})),
          })
        )

        const downloaded = yield* _(
          client.Images.downloadChatImage({
            headers: commonHeaders,
            payload: {imageId},
          })
        )

        expect(downloaded.data).toEqual(data)
      })
    )
  })

  it('Rejects upload with invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Images.uploadChatImage({
            headers: commonHeaders,
            payload: yield* _(
              user.inbox1.addChallenge({data: randomImageData(16)}, true)
            ),
          }),
          Effect.either
        )

        expectErrorResponse(InvalidChallengeError)(response)
      })
    )
  })

  it('Rejects upload from a sender without inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Images.uploadChatImage({
            headers: commonHeaders,
            payload: yield* _(
              addChallengeForKey(
                generatePrivateKey(),
                user.authHeaders
              )({data: randomImageData(16)})
            ),
          }),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(response)
      })
    )
  })

  it('Returns not found for unknown image id', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Images.downloadChatImage({
            headers: commonHeaders,
            payload: {imageId: Schema.decodeSync(ChatImageId)(randomUUID())},
          }),
          Effect.either
        )

        expectErrorResponse(ChatImageNotFoundError)(response)
      })
    )
  })
})

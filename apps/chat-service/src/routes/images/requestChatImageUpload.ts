import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ChatImageId} from '@vexl-next/domain/src/general/messaging'
import {
  CHAT_IMAGE_CONTENT_TYPE,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {S3Service} from '@vexl-next/server-utils/src/S3Service'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option, Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {ensureInboxExists} from '../../utils/ensureInboxExists'
import {CHAT_IMAGE_URL_EXPIRES_IN_SECONDS} from './constants'

export const requestChatImageUpload = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Images',
  'requestChatImageUpload',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(
        validateChallengeInBody({
          publicKey: req.payload.senderPublicKey,
          publicKeyV2: Option.none(),
          signedChallenge: req.payload.signedChallenge,
        })
      )

      yield* _(
        ensureInboxExists(req.payload.senderPublicKey),
        Effect.catchTag(
          'InboxDoesNotExist',
          () => new SenderInboxDoesNotExistError()
        )
      )

      const imageId = Schema.decodeSync(ChatImageId)(randomUUID())
      const s3 = yield* _(S3Service)
      const {presignedUrl} = yield* _(
        s3.generatePresignedUploadUrl({
          key: imageId,
          contentType: CHAT_IMAGE_CONTENT_TYPE,
          contentLength: req.payload.size,
          expiresIn: CHAT_IMAGE_URL_EXPIRES_IN_SECONDS,
        }),
        Effect.mapError((e) => new UnexpectedServerError({message: e.message}))
      )

      return {imageId, uploadUrl: presignedUrl}
    }).pipe(makeEndpointEffect)
)

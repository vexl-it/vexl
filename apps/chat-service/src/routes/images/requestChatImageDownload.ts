import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {S3Service} from '@vexl-next/server-utils/src/S3Service'
import {Effect} from 'effect'
import {CHAT_IMAGE_URL_EXPIRES_IN_SECONDS} from './constants'

export const requestChatImageDownload = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Images',
  'requestChatImageDownload',
  (req) =>
    Effect.gen(function* (_) {
      const s3 = yield* _(S3Service)
      const downloadUrl = yield* _(
        s3.generatePresignedDownloadUrl({
          key: req.payload.imageId,
          expiresIn: CHAT_IMAGE_URL_EXPIRES_IN_SECONDS,
        }),
        Effect.mapError((e) => new UnexpectedServerError({message: e.message}))
      )

      return {downloadUrl}
    }).pipe(makeEndpointEffect)
)

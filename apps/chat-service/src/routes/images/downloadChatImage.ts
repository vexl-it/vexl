import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {ChatImageNotFoundError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {S3Service} from '@vexl-next/server-utils/src/S3Service'
import {Effect, Option, Schema} from 'effect'

export const downloadChatImage = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Images',
  'downloadChatImage',
  (req) =>
    Effect.gen(function* (_) {
      const s3 = yield* _(S3Service)
      const image = yield* _(
        s3.getObject({key: req.payload.imageId}),
        Effect.mapError((e) => new UnexpectedServerError({message: e.message}))
      )

      if (Option.isNone(image)) return yield* _(new ChatImageNotFoundError())

      return {
        data: Schema.decodeSync(Base64String)(
          Buffer.from(image.value).toString('base64')
        ),
      }
    }).pipe(makeEndpointEffect)
)

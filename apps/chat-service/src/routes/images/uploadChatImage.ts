import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ChatImageId} from '@vexl-next/domain/src/general/messaging'
import {SenderInboxDoesNotExistError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {S3Service} from '@vexl-next/server-utils/src/S3Service'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option, Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {ensureInboxExists} from '../../utils/ensureInboxExists'

export const uploadChatImage = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Images',
  'uploadChatImage',
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
      yield* _(
        s3.putObject({
          key: imageId,
          body: Buffer.from(req.payload.data, 'base64'),
          contentType: 'application/octet-stream',
        }),
        Effect.mapError((e) => new UnexpectedServerError({message: e.message}))
      )

      return {imageId}
    }).pipe(makeEndpointEffect)
)

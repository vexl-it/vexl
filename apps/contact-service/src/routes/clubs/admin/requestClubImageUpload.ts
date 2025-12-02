import {HttpApiBuilder} from '@effect/platform/index'
import {
  type ImageExtension,
  S3ServiceError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {randomUUID} from 'crypto'
import {Effect} from 'effect'
import {S3Service} from '../../../utils/S3Service'
import {validateAdminToken} from '../utils/validateAdminToken'

const getContentTypeFromExtension = (extension: ImageExtension): string => {
  switch (extension) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
  }
}

export const requestClubImageUpload = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsAdmin',
  'requestClubImageUpload',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.urlParams.adminToken))

      const s3Service = yield* _(S3Service)
      const {fileExtension} = req.payload

      // Derive content type from extension
      const contentType = getContentTypeFromExtension(fileExtension)

      // Generate unique S3 key: clubs/{uuid}.{extension}
      const uniqueId = randomUUID()
      const s3Key = `clubs/${uniqueId}.${fileExtension}`

      // Generate presigned URL
      const result = yield* _(
        s3Service.generatePresignedUploadUrl({
          key: s3Key,
          contentType,
          expiresIn: 900, // 15 minutes
        }),
        Effect.catchTag('S3Error', (error) =>
          Effect.fail(
            new S3ServiceError({
              status: 502,
              message: error.message ?? 'Failed to generate presigned URL',
            })
          )
        )
      )

      return {
        presignedUrl: result.presignedUrl,
        s3Key: result.s3Key,
        expiresIn: result.expiresIn,
      }
    }).pipe(makeEndpointEffect)
)

import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {
  type ImageExtension,
  S3ServiceError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {randomUUID} from 'crypto'
import {Effect, pipe} from 'effect'
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

export const requestClubImageUpload = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'requestClubImageUpload',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const s3Service = yield* S3Service
      const {fileExtension} = req.payload

      // Derive content type from extension
      const contentType = getContentTypeFromExtension(fileExtension)

      // Generate unique S3 key: clubs/{uuid}.{extension}
      const uniqueId = randomUUID()
      const s3Key = `clubs/${uniqueId}.${fileExtension}`

      // Generate presigned URL
      const result = yield* pipe(
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
        contentType,
        expiresIn: result.expiresIn,
      }
    }).pipe(makeEndpointEffect)
)

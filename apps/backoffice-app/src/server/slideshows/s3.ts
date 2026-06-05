import {
  type FileExtension,
  type RequestUploadRequest,
  RequestUploadResponse,
} from '@/src/services/slideshows/domain'
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {type ConfigError, Effect, Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {slideshowS3Config} from './config'

export class S3UploadRequestError extends Schema.TaggedError<S3UploadRequestError>(
  'S3UploadRequestError'
)('S3UploadRequestError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

const getContentType = (extension: FileExtension): string => {
  switch (extension) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
  }
}

const trimTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value

export const createSlideshowUpload = (
  input: RequestUploadRequest
): Effect.Effect<
  RequestUploadResponse,
  S3UploadRequestError | ConfigError.ConfigError
> =>
  Effect.gen(function* (_) {
    const {region, bucketName, resourcesBaseUrl, endpoint, forcePathStyle} =
      yield* _(slideshowS3Config)
    const s3Client = new S3Client({
      region,
      endpoint: endpoint.length > 0 ? endpoint : undefined,
      forcePathStyle,
    })
    const contentType = getContentType(input.fileExtension)
    const assetUuid = randomUUID()
    const s3Key = `backoffice/slideshows/${input.slideshowUuid}/${assetUuid}.${input.fileExtension}`
    const expiresIn = 900
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: contentType,
    })

    const presignedUrl = yield* _(
      Effect.tryPromise({
        try: () => getSignedUrl(s3Client, command, {expiresIn}),
        catch: (error) =>
          new S3UploadRequestError({
            cause: error,
            message: 'Failed to generate presigned upload URL',
          }),
      })
    )

    return Schema.decodeUnknownSync(RequestUploadResponse)({
      presignedUrl,
      assetUrl: `${trimTrailingSlash(resourcesBaseUrl)}/${s3Key}`,
      s3Key,
      contentType,
      expiresIn,
    })
  })

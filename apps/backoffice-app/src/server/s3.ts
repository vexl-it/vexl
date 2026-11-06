import {RequestUploadResponse} from '@/src/services/uploadToPresignedUrl'
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {type ConfigError, Effect, Schema} from 'effect'
import {slideshowS3Config} from './config'

export class S3UploadRequestError extends Schema.TaggedError<S3UploadRequestError>(
  'S3UploadRequestError'
)('S3UploadRequestError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

const trimTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value

const EXPIRES_IN_SECONDS = 900

export const createPresignedUpload = ({
  s3Key,
  contentType,
}: {
  readonly s3Key: string
  readonly contentType: string
}): Effect.Effect<
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
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: contentType,
    })

    const presignedUrl = yield* _(
      Effect.tryPromise({
        // Unsigned by default, which would let the uploader pick any type.
        try: () =>
          getSignedUrl(s3Client, command, {
            expiresIn: EXPIRES_IN_SECONDS,
            signableHeaders: new Set(['content-type']),
          }),
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
      expiresIn: EXPIRES_IN_SECONDS,
    })
  })

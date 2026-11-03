import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {Context, Effect, Layer, Schema} from 'effect'
import {s3Config} from './commonConfigs'

export class S3Error extends Schema.TaggedError<S3Error>('S3Error')('S3Error', {
  cause: Schema.Unknown,
  message: Schema.optional(Schema.String),
}) {}

export interface S3Operations {
  generatePresignedUploadUrl: (params: {
    key: string
    contentType: string
    contentLength?: number
    expiresIn?: number
  }) => Effect.Effect<
    {
      presignedUrl: string
      s3Key: string
      expiresIn: number
    },
    S3Error
  >
}

export class S3Service extends Context.Tag('S3Service')<
  S3Service,
  S3Operations
>() {
  static readonly Live = Layer.effect(
    S3Service,
    Effect.gen(function* (_) {
      const {region, bucketName, endpoint, forcePathStyle} = yield* _(s3Config)
      // Credentials come from the standard AWS_* env vars.
      const s3Client = new S3Client({
        region,
        endpoint: endpoint.length > 0 ? endpoint : undefined,
        forcePathStyle,
        // By default upload URLs carry a CRC32 of the empty presign body, which
        // S3 then checks against the uploaded bytes.
        requestChecksumCalculation: 'WHEN_REQUIRED',
      })

      // The span carries no key: chat image keys must not end up in traces.
      const generatePresignedUploadUrl: S3Operations['generatePresignedUploadUrl'] =
        ({key, contentType, contentLength, expiresIn = 900}) =>
          Effect.tryPromise({
            try: async () =>
              await getSignedUrl(
                s3Client,
                new PutObjectCommand({
                  Bucket: bucketName,
                  Key: key,
                  ContentType: contentType,
                  ContentLength: contentLength,
                }),
                {
                  expiresIn,
                  // The presigner leaves content-type unsigned by default.
                  signableHeaders: new Set(['content-type']),
                }
              ),
            catch: (error) =>
              new S3Error({
                cause: error,
                message: 'Failed to generate presigned URL',
              }),
          }).pipe(
            Effect.map((presignedUrl) => ({
              presignedUrl,
              s3Key: key,
              expiresIn,
            })),
            Effect.withSpan('S3 generatePresignedUploadUrl', {
              attributes: {contentType, contentLength, expiresIn},
            })
          )

      return {generatePresignedUploadUrl}
    })
  )
}

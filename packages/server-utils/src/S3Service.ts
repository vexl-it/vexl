import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
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
  generatePresignedDownloadUrl: (params: {
    key: string
    expiresIn: number
  }) => Effect.Effect<string, S3Error>
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

      // Spans carry no key: chat image keys must not end up in traces.
      const presign = (
        command: PutObjectCommand | GetObjectCommand,
        expiresIn: number
      ): Effect.Effect<string, S3Error> =>
        Effect.tryPromise({
          try: async () =>
            await getSignedUrl(s3Client, command, {
              expiresIn,
              // The presigner leaves content-type unsigned by default.
              signableHeaders: new Set(['content-type']),
            }),
          catch: (error) =>
            new S3Error({
              cause: error,
              message: 'Failed to generate presigned URL',
            }),
        })

      const generatePresignedUploadUrl: S3Operations['generatePresignedUploadUrl'] =
        ({key, contentType, contentLength, expiresIn = 900}) =>
          presign(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              ContentType: contentType,
              ContentLength: contentLength,
            }),
            expiresIn
          ).pipe(
            Effect.map((presignedUrl) => ({
              presignedUrl,
              s3Key: key,
              expiresIn,
            })),
            Effect.withSpan('S3 generatePresignedUploadUrl', {
              attributes: {contentType, contentLength, expiresIn},
            })
          )

      const generatePresignedDownloadUrl: S3Operations['generatePresignedDownloadUrl'] =
        ({key, expiresIn}) =>
          presign(
            new GetObjectCommand({Bucket: bucketName, Key: key}),
            expiresIn
          ).pipe(
            Effect.withSpan('S3 generatePresignedDownloadUrl', {
              attributes: {expiresIn},
            })
          )

      return {generatePresignedUploadUrl, generatePresignedDownloadUrl}
    })
  )
}

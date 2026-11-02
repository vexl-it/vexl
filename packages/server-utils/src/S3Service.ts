import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {Context, Effect, Layer, Option, Schema} from 'effect'
import {s3Config} from './commonConfigs'

export class S3Error extends Schema.TaggedError<S3Error>('S3Error')('S3Error', {
  cause: Schema.Unknown,
  message: Schema.optional(Schema.String),
}) {}

// Only the SDK error name goes into the message: S3 errors can carry bucket and
// key, which must not leak into logs for privacy-sensitive objects.
const s3ErrorMessage = (operation: string, error: unknown): string =>
  `Failed to ${operation} (${error instanceof Error ? error.name : 'unknown error'})`

export interface S3Operations {
  generatePresignedUploadUrl: (params: {
    key: string
    contentType: string
    expiresIn?: number
  }) => Effect.Effect<
    {
      presignedUrl: string
      s3Key: string
      expiresIn: number
    },
    S3Error
  >
  putObject: (params: {
    key: string
    body: Uint8Array
    contentType: string
  }) => Effect.Effect<void, S3Error>
  getObject: (params: {
    key: string
  }) => Effect.Effect<Option.Option<Uint8Array>, S3Error>
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
      })

      const generatePresignedUploadUrl: S3Operations['generatePresignedUploadUrl'] =
        ({key, contentType, expiresIn = 900}) =>
          Effect.tryPromise({
            try: async () =>
              await getSignedUrl(
                s3Client,
                new PutObjectCommand({
                  Bucket: bucketName,
                  Key: key,
                  ContentType: contentType,
                }),
                {expiresIn}
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
              attributes: {key, contentType, expiresIn},
            })
          )

      const putObject: S3Operations['putObject'] = ({key, body, contentType}) =>
        Effect.tryPromise({
          try: async () =>
            await s3Client.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: body,
                ContentType: contentType,
              })
            ),
          catch: (error) =>
            new S3Error({
              cause: error,
              message: s3ErrorMessage('put object', error),
            }),
        }).pipe(Effect.asVoid, Effect.withSpan('S3 putObject'))

      const getObject: S3Operations['getObject'] = ({key}) =>
        Effect.tryPromise({
          try: async () => {
            const {Body} = await s3Client.send(
              new GetObjectCommand({Bucket: bucketName, Key: key})
            )
            return Option.fromNullable(await Body?.transformToByteArray())
          },
          catch: (error) => error,
        }).pipe(
          Effect.catchIf(
            (error) => error instanceof NoSuchKey,
            () => Effect.succeedNone
          ),
          Effect.mapError(
            (error) =>
              new S3Error({
                cause: error,
                message: s3ErrorMessage('get object', error),
              })
          ),
          Effect.withSpan('S3 getObject')
        )

      return {generatePresignedUploadUrl, putObject, getObject}
    })
  )
}

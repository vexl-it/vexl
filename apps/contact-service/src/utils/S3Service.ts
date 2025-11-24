import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {Context, Effect, Layer, Schema} from 'effect'
import {s3Config} from '../configs'

export class S3Error extends Schema.TaggedError<S3Error>('S3Error')('S3Error', {
  cause: Schema.Unknown,
  message: Schema.optional(Schema.String),
}) {}

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
}

export class S3Service extends Context.Tag('S3Service')<
  S3Service,
  S3Operations
>() {
  static readonly Live = Layer.effect(
    S3Service,
    Effect.gen(function* (_) {
      const {accessKeyId, secretAccessKey, region, bucketName, profile} =
        yield* _(s3Config)
      // Create S3 client with appropriate credentials
      const s3Client = yield* _(
        Effect.sync(() => {
          const clientConfig: {
            region: string
            credentials?: {accessKeyId: string; secretAccessKey: string}
            profile?: string
          } = {region}

          // Priority: explicit credentials > profile > default provider chain (IAM roles, OIDC, etc.)
          if (accessKeyId._tag === 'Some' && secretAccessKey._tag === 'Some') {
            clientConfig.credentials = {
              accessKeyId: accessKeyId.value,
              secretAccessKey: secretAccessKey.value,
            }
          } else if (profile._tag === 'Some') {
            clientConfig.profile = profile.value
          }
          // Otherwise, use default credential provider chain
          // In EKS: automatically uses OIDC via service account
          // In EC2: automatically uses instance IAM role
          // Local dev: uses explicit credentials above or AWS profile

          return new S3Client(clientConfig)
        })
      )

      const generatePresignedUploadUrl: S3Operations['generatePresignedUploadUrl'] =
        (params) => {
          const {key, contentType, expiresIn = 900} = params // Default 15 minutes

          return Effect.gen(function* (_) {
            const command = new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              ContentType: contentType,
            })

            const presignedUrl: string = yield* _(
              Effect.tryPromise({
                try: async () =>
                  await getSignedUrl(s3Client, command, {
                    expiresIn,
                  }),
                catch: (error) =>
                  new S3Error({
                    cause: error,
                    message: 'Failed to generate presigned URL',
                  }),
              })
            )

            return {
              presignedUrl,
              s3Key: key,
              expiresIn,
            }
          }).pipe(
            Effect.withSpan('S3 generatePresignedUploadUrl', {
              attributes: {key, contentType, expiresIn},
            })
          )
        }

      return {
        generatePresignedUploadUrl,
      }
    })
  )
}

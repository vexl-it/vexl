import {Effect, Layer} from 'effect'
import {S3Service} from '../S3Service'

export const mockedS3ServiceLayer = Layer.succeed(S3Service, {
  generatePresignedUploadUrl: ({
    key,
    contentType,
    contentLength,
    expiresIn = 900,
  }) =>
    Effect.succeed({
      presignedUrl: `https://s3.example.com/upload?key=${key}&contentType=${contentType}&contentLength=${contentLength}`,
      s3Key: key,
      expiresIn,
    }),
  generatePresignedDownloadUrl: ({key}) =>
    Effect.succeed(`https://s3.example.com/download?key=${key}`),
})

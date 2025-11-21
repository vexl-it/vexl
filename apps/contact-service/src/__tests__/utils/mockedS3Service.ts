import {Effect, Layer} from 'effect'
import {S3Service} from '../../utils/S3Service'

export const generatePresignedUploadUrlMock = jest.fn(
  async (params: {
    key: string
    contentType: string
    expiresIn?: number
  }): Promise<{
    presignedUrl: string
    s3Key: string
    expiresIn: number
  }> => ({
    presignedUrl: `https://s3.example.com/presigned-url?key=${params.key}&contentType=${params.contentType}`,
    s3Key: params.key,
    expiresIn: params.expiresIn ?? 900,
  })
)

export const mockedS3ServiceLayer = Layer.effect(
  S3Service,
  Effect.succeed({
    generatePresignedUploadUrl: (params) =>
      // eslint-disable-next-line @typescript-eslint/return-await
      Effect.promise(async () => await generatePresignedUploadUrlMock(params)),
  })
)

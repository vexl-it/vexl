import {
  type FileExtension,
  type RequestUploadRequest,
} from '@/src/services/slideshows/domain'
import {type RequestUploadResponse} from '@/src/services/uploadToPresignedUrl'
import {type ConfigError, type Effect} from 'effect'
import {randomUUID} from 'node:crypto'
import {createPresignedUpload, type S3UploadRequestError} from '../s3'

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

export const createSlideshowUpload = (
  input: RequestUploadRequest
): Effect.Effect<
  RequestUploadResponse,
  S3UploadRequestError | ConfigError.ConfigError
> =>
  createPresignedUpload({
    s3Key: `backoffice/slideshows/${input.slideshowUuid}/${randomUUID()}.${input.fileExtension}`,
    contentType: getContentType(input.fileExtension),
  })

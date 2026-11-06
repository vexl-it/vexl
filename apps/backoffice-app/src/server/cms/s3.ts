import {
  cmsImageContentType,
  type RequestCmsImageUploadRequest,
} from '@/src/services/cms/domain'
import {type RequestUploadResponse} from '@/src/services/uploadToPresignedUrl'
import {type ConfigError, type Effect} from 'effect'
import {randomUUID} from 'node:crypto'
import {createPresignedUpload, type S3UploadRequestError} from '../s3'

/** Same prefix as the images imported from Webflow. */
export const createCmsImageUpload = ({
  fileExtension,
}: RequestCmsImageUploadRequest): Effect.Effect<
  RequestUploadResponse,
  S3UploadRequestError | ConfigError.ConfigError
> =>
  createPresignedUpload({
    s3Key: `content/cms/${randomUUID()}.${fileExtension}`,
    contentType: cmsImageContentType(fileExtension),
  })

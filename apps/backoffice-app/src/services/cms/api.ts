import {Option, Predicate, Schema} from 'effect'
import {jsonHeaders, requestJson} from '../adminFetch'
import {
  RequestUploadResponse,
  uploadToPresignedUrl,
} from '../uploadToPresignedUrl'
import {cmsImageExtensionForMimeType} from './domain'

const ERROR_MESSAGES: Record<string, string> = {
  BlogSlugTakenError: 'Another post already uses this slug.',
  InvalidContentAdminTokenError:
    'Your token is not allowed to manage content. Sign in again.',
  NotFoundError: 'It no longer exists. Reload the page.',
}

export const cmsErrorMessage = (error: unknown): string => {
  if (Predicate.hasProperty(error, '_tag') && Predicate.isString(error._tag)) {
    const message = ERROR_MESSAGES[error._tag]
    if (message) return message
  }
  return error instanceof Error && error.message.length > 0
    ? error.message
    : 'Request failed'
}

/** Uploads to the resources bucket and returns the public URL. */
export const uploadCmsImage = async (
  adminToken: string,
  file: File
): Promise<string> => {
  const fileExtension = Option.getOrThrowWith(
    cmsImageExtensionForMimeType(file.type),
    () => new Error('Use a PNG, JPEG, WebP or GIF image.')
  )

  const upload = Schema.decodeUnknownSync(RequestUploadResponse)(
    await requestJson<unknown>('/api/admin/cms/request-upload', {
      method: 'POST',
      headers: jsonHeaders(adminToken),
      body: JSON.stringify({fileExtension}),
    })
  )
  await uploadToPresignedUrl({
    presignedUrl: upload.presignedUrl,
    contentType: upload.contentType,
    file,
  })
  return upload.assetUrl
}

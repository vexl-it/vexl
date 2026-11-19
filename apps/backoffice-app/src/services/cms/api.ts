import {Option, Schema} from 'effect'
import {jsonHeaders, requestJson} from '../adminFetch'
import {makeApiErrorMessage} from '../apiErrorMessage'
import {
  RequestUploadResponse,
  uploadToPresignedUrl,
} from '../uploadToPresignedUrl'
import {cmsImageExtensionForMimeType} from './domain'

export const cmsErrorMessage = makeApiErrorMessage({
  BlogSlugTakenError: 'Another post already uses this slug.',
  InvalidContentAdminTokenError:
    'Your token is not allowed to manage content. Sign in again.',
  NotFoundError: 'It no longer exists. Reload the page.',
})

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

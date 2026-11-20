import {Schema} from 'effect'
import {requestJson, requestNoContent} from '../adminFetch'
import {RequestUploadResponse} from '../uploadToPresignedUrl'
import {
  type CreateSlideshowRequest,
  type RequestUploadRequest,
  type SlideshowListResponse,
  type SlideshowResponse,
  type UpdateSlideshowRequest,
} from './domain'

export const listSlideshows = (): Promise<SlideshowListResponse> =>
  requestJson('/api/admin/slideshows', {
    method: 'GET',
  })

export const getSlideshow = (uuid: string): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}`, {
    method: 'GET',
  })

export const createSlideshow = (
  payload: CreateSlideshowRequest
): Promise<SlideshowResponse> =>
  requestJson('/api/admin/slideshows', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateSlideshow = (
  uuid: string,
  payload: UpdateSlideshowRequest
): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteSlideshow = (uuid: string): Promise<void> =>
  requestNoContent(`/api/admin/slideshows/${uuid}`, {
    method: 'DELETE',
  })

export const duplicateSlideshow = (uuid: string): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}/duplicate`, {
    method: 'POST',
  })

export const regenerateSlideshowToken = (
  uuid: string
): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}/regenerate-token`, {
    method: 'POST',
  })

const requestSlideshowUpload = async (
  payload: RequestUploadRequest
): Promise<RequestUploadResponse> => {
  const response = await requestJson<unknown>(
    '/api/admin/slideshows/request-upload',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )

  try {
    return Schema.decodeUnknownSync(RequestUploadResponse)(response)
  } catch {
    throw new Error(
      'Unexpected response shape from /api/admin/slideshows/request-upload. The server may be running an older version.'
    )
  }
}

const putFile = (
  upload: RequestUploadResponse,
  file: File,
  onProgress: (fraction: number) => void
): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', upload.presignedUrl)
    request.setRequestHeader('Content-Type', upload.contentType)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total)
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else reject(new Error(`Storage rejected the upload (${request.status})`))
    }
    request.onerror = () => {
      reject(
        new Error('Upload failed before the storage responded. Try again.')
      )
    }
    request.send(file)
  })

/** `fetch` cannot report upload progress, hence the XMLHttpRequest. */
export const uploadSlideshowFile = async ({
  file,
  onProgress,
  ...payload
}: RequestUploadRequest & {
  readonly file: File
  readonly onProgress: (fraction: number) => void
}): Promise<RequestUploadResponse> => {
  const upload = await requestSlideshowUpload(payload)
  await putFile(upload, file, onProgress)
  return upload
}

export const getPublicSlideshow = (
  publicToken: string
): Promise<SlideshowResponse> =>
  requestJson(`/api/tv-slideshows/${publicToken}`, {
    method: 'GET',
  })

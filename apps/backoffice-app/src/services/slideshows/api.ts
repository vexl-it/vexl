import {Schema} from 'effect'
import {requestJson, requestNoContent} from '../adminFetch'
import {
  RequestUploadResponse as RequestUploadResponseSchema,
  type RequestUploadResponse,
} from '../uploadToPresignedUrl'
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

export const requestSlideshowUpload = async (
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
    return Schema.decodeUnknownSync(RequestUploadResponseSchema)(response)
  } catch {
    throw new Error(
      'Unexpected response shape from /api/admin/slideshows/request-upload. The server may be running an older version.'
    )
  }
}

export const getPublicSlideshow = (
  publicToken: string
): Promise<SlideshowResponse> =>
  requestJson(`/api/tv-slideshows/${publicToken}`, {
    method: 'GET',
  })

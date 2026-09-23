import {Schema} from 'effect'
import {jsonHeaders, requestJson, requestNoContent} from '../adminFetch'
import {
  RequestUploadResponse as RequestUploadResponseSchema,
  type CreateSlideshowRequest,
  type RequestUploadRequest,
  type RequestUploadResponse,
  type SlideshowListResponse,
  type SlideshowResponse,
  type UpdateSlideshowRequest,
} from './domain'

export const listSlideshows = (
  adminToken: string
): Promise<SlideshowListResponse> =>
  requestJson('/api/admin/slideshows', {
    method: 'GET',
    headers: jsonHeaders(adminToken),
  })

export const getSlideshow = (
  adminToken: string,
  uuid: string
): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}`, {
    method: 'GET',
    headers: jsonHeaders(adminToken),
  })

export const createSlideshow = (
  adminToken: string,
  payload: CreateSlideshowRequest
): Promise<SlideshowResponse> =>
  requestJson('/api/admin/slideshows', {
    method: 'POST',
    headers: jsonHeaders(adminToken),
    body: JSON.stringify(payload),
  })

export const updateSlideshow = (
  adminToken: string,
  uuid: string,
  payload: UpdateSlideshowRequest
): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}`, {
    method: 'PUT',
    headers: jsonHeaders(adminToken),
    body: JSON.stringify(payload),
  })

export const deleteSlideshow = (
  adminToken: string,
  uuid: string
): Promise<void> =>
  requestNoContent(`/api/admin/slideshows/${uuid}`, {
    method: 'DELETE',
    headers: jsonHeaders(adminToken),
  })

export const duplicateSlideshow = (
  adminToken: string,
  uuid: string
): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}/duplicate`, {
    method: 'POST',
    headers: jsonHeaders(adminToken),
  })

export const regenerateSlideshowToken = (
  adminToken: string,
  uuid: string
): Promise<SlideshowResponse> =>
  requestJson(`/api/admin/slideshows/${uuid}/regenerate-token`, {
    method: 'POST',
    headers: jsonHeaders(adminToken),
  })

export const requestSlideshowUpload = async (
  adminToken: string,
  payload: RequestUploadRequest
): Promise<RequestUploadResponse> => {
  const response = await requestJson<unknown>(
    '/api/admin/slideshows/request-upload',
    {
      method: 'POST',
      headers: jsonHeaders(adminToken),
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

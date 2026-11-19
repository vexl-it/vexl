import {requestJson, requestNoContent} from '../adminFetch'
import {
  type CreateShortLinkRequest,
  type ShortLinkListResponse,
  type ShortLinkResponse,
  type UpdateShortLinkRequest,
} from './domain'

export const listShortLinks = (): Promise<ShortLinkListResponse> =>
  requestJson('/api/admin/short-links', {
    method: 'GET',
  })

export const createShortLink = (
  payload: CreateShortLinkRequest
): Promise<ShortLinkResponse> =>
  requestJson('/api/admin/short-links', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateShortLink = (
  slug: string,
  payload: UpdateShortLinkRequest
): Promise<ShortLinkResponse> =>
  requestJson(`/api/admin/short-links/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const deleteShortLink = (slug: string): Promise<void> =>
  requestNoContent(`/api/admin/short-links/${slug}`, {
    method: 'DELETE',
  })

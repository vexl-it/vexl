import {jsonHeaders, requestJson, requestNoContent} from '../adminFetch'
import {
  type CreateShortLinkRequest,
  type ShortLinkListResponse,
  type ShortLinkResponse,
  type UpdateShortLinkRequest,
} from './domain'

export const listShortLinks = (
  adminToken: string
): Promise<ShortLinkListResponse> =>
  requestJson('/api/admin/short-links', {
    method: 'GET',
    headers: jsonHeaders(adminToken),
  })

export const createShortLink = (
  adminToken: string,
  payload: CreateShortLinkRequest
): Promise<ShortLinkResponse> =>
  requestJson('/api/admin/short-links', {
    method: 'POST',
    headers: jsonHeaders(adminToken),
    body: JSON.stringify(payload),
  })

export const updateShortLink = (
  adminToken: string,
  slug: string,
  payload: UpdateShortLinkRequest
): Promise<ShortLinkResponse> =>
  requestJson(`/api/admin/short-links/${slug}`, {
    method: 'PATCH',
    headers: jsonHeaders(adminToken),
    body: JSON.stringify(payload),
  })

export const deleteShortLink = (
  adminToken: string,
  slug: string
): Promise<void> =>
  requestNoContent(`/api/admin/short-links/${slug}`, {
    method: 'DELETE',
    headers: jsonHeaders(adminToken),
  })

import {Schema} from 'effect'
import {requestJson, requestNoContent} from '../adminFetch'
import {
  type CreateShortLinkRequest,
  ShortLinkListResponse,
  ShortLinkResponse,
  type UpdateShortLinkRequest,
} from './domain'

const decodeList = Schema.decodeUnknownPromise(ShortLinkListResponse)
const decodeLink = Schema.decodeUnknownPromise(ShortLinkResponse)

export const listShortLinks = (): Promise<ShortLinkListResponse> =>
  requestJson<unknown>('/api/admin/short-links', {
    method: 'GET',
  }).then(decodeList)

export const createShortLink = (
  payload: CreateShortLinkRequest
): Promise<ShortLinkResponse> =>
  requestJson<unknown>('/api/admin/short-links', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(decodeLink)

export const updateShortLink = (
  slug: string,
  payload: UpdateShortLinkRequest
): Promise<ShortLinkResponse> =>
  requestJson<unknown>(`/api/admin/short-links/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then(decodeLink)

export const deleteShortLink = (slug: string): Promise<void> =>
  requestNoContent(`/api/admin/short-links/${slug}`, {
    method: 'DELETE',
  })

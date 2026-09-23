import {Schema} from 'effect'
import {HttpUrl} from '../urlSchemas'

export const ShortLinkSlug = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/)
)
export type ShortLinkSlug = typeof ShortLinkSlug.Type

export const ShortLinkDailyClicks = Schema.Struct({
  day: Schema.String,
  count: Schema.Int,
})
export type ShortLinkDailyClicks = typeof ShortLinkDailyClicks.Type

export const ShortLink = Schema.Struct({
  slug: ShortLinkSlug,
  targetUrl: HttpUrl,
  createdAt: Schema.NonEmptyString,
  updatedAt: Schema.NonEmptyString,
  totalClicks: Schema.Int,
  clicksLast7Days: Schema.Int,
  dailyClicks: Schema.Array(ShortLinkDailyClicks),
})
export type ShortLink = typeof ShortLink.Type

export const CreateShortLinkRequest = Schema.Struct({
  slug: Schema.optional(ShortLinkSlug),
  targetUrl: HttpUrl,
})
export type CreateShortLinkRequest = typeof CreateShortLinkRequest.Type

export const UpdateShortLinkRequest = Schema.Struct({
  targetUrl: HttpUrl,
})
export type UpdateShortLinkRequest = typeof UpdateShortLinkRequest.Type

export const ShortLinkListResponse = Schema.Struct({
  links: Schema.Array(ShortLink),
})
export type ShortLinkListResponse = typeof ShortLinkListResponse.Type

export const ShortLinkResponse = Schema.Struct({
  link: ShortLink,
})
export type ShortLinkResponse = typeof ShortLinkResponse.Type

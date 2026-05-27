import {Schema} from 'effect'

const HttpsUrl = Schema.String.pipe(
  Schema.filter((url) => {
    try {
      return new URL(url).protocol === 'https:'
    } catch {
      return false
    }
  })
)

const AssetUrl = Schema.String.pipe(
  Schema.filter((url) => {
    try {
      const protocol = new URL(url).protocol
      return protocol === 'https:' || protocol === 'http:'
    } catch {
      return false
    }
  })
)

export const SlideDurationSeconds = Schema.Int.pipe(
  Schema.greaterThanOrEqualTo(1),
  Schema.lessThanOrEqualTo(24 * 60 * 60)
)

export const PublicSlug = Schema.NonEmptyString.pipe(
  Schema.filter((slug) => /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(slug))
)
export type PublicSlug = typeof PublicSlug.Type

export const OptionalPublicSlug = Schema.Union(PublicSlug, Schema.Null)
export type OptionalPublicSlug = typeof OptionalPublicSlug.Type

export const ImageSlide = Schema.Struct({
  uuid: Schema.UUID,
  type: Schema.Literal('image'),
  url: AssetUrl,
  s3Key: Schema.NonEmptyString,
  fit: Schema.Literal('cover', 'contain'),
  durationSeconds: SlideDurationSeconds,
})

export const VideoSlide = Schema.Struct({
  uuid: Schema.UUID,
  type: Schema.Literal('video'),
  url: AssetUrl,
  s3Key: Schema.NonEmptyString,
  durationSeconds: SlideDurationSeconds,
})

export const WebsiteSlide = Schema.Struct({
  uuid: Schema.UUID,
  type: Schema.Literal('website'),
  url: HttpsUrl,
  durationSeconds: SlideDurationSeconds,
})

export const SlideshowSlide = Schema.Union(ImageSlide, VideoSlide, WebsiteSlide)
export type SlideshowSlide = typeof SlideshowSlide.Type

export const SlideshowSlides = Schema.Array(SlideshowSlide)
export type SlideshowSlides = typeof SlideshowSlides.Type

export const TvSlideshow = Schema.Struct({
  uuid: Schema.UUID,
  publicToken: Schema.NonEmptyString,
  publicSlug: OptionalPublicSlug,
  name: Schema.NonEmptyString,
  slides: SlideshowSlides,
  isEnabled: Schema.Boolean,
  createdAt: Schema.NonEmptyString,
  updatedAt: Schema.NonEmptyString,
})
export type TvSlideshow = typeof TvSlideshow.Type

export const CreateSlideshowRequest = Schema.Struct({
  uuid: Schema.optional(Schema.UUID),
  publicSlug: Schema.optional(OptionalPublicSlug),
  name: Schema.NonEmptyString,
  slides: SlideshowSlides,
  isEnabled: Schema.Boolean,
})
export type CreateSlideshowRequest = typeof CreateSlideshowRequest.Type

export const UpdateSlideshowRequest = Schema.Struct({
  publicSlug: OptionalPublicSlug,
  name: Schema.NonEmptyString,
  slides: SlideshowSlides,
  isEnabled: Schema.Boolean,
})
export type UpdateSlideshowRequest = typeof UpdateSlideshowRequest.Type

export const SlideshowListResponse = Schema.Struct({
  slideshows: Schema.Array(TvSlideshow),
})
export type SlideshowListResponse = typeof SlideshowListResponse.Type

export const SlideshowResponse = Schema.Struct({
  slideshow: TvSlideshow,
})
export type SlideshowResponse = typeof SlideshowResponse.Type

export const FileExtension = Schema.Literal(
  'png',
  'jpg',
  'jpeg',
  'webp',
  'mp4',
  'webm'
)
export type FileExtension = typeof FileExtension.Type

export const RequestUploadRequest = Schema.Struct({
  slideshowUuid: Schema.UUID,
  fileExtension: FileExtension,
})
export type RequestUploadRequest = typeof RequestUploadRequest.Type

export const RequestUploadResponse = Schema.Struct({
  presignedUrl: Schema.NonEmptyString,
  assetUrl: AssetUrl,
  s3Key: Schema.NonEmptyString,
  expiresIn: Schema.Int,
})
export type RequestUploadResponse = typeof RequestUploadResponse.Type

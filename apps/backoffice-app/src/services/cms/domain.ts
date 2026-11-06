import {Array, Option, pipe, Record, Schema} from 'effect'

/** Raster only. SVG can carry scripts. */
export const CmsImageExtension = Schema.Literal('png', 'jpg', 'webp', 'gif')
export type CmsImageExtension = typeof CmsImageExtension.Type

const CONTENT_TYPE_BY_EXTENSION: Record.ReadonlyRecord<
  CmsImageExtension,
  string
> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

export const RequestCmsImageUploadRequest = Schema.Struct({
  fileExtension: CmsImageExtension,
})
export type RequestCmsImageUploadRequest =
  typeof RequestCmsImageUploadRequest.Type

export const ACCEPTED_CMS_IMAGE_TYPES = Record.values(
  CONTENT_TYPE_BY_EXTENSION
).join(',')

export const cmsImageContentType = (extension: CmsImageExtension): string =>
  CONTENT_TYPE_BY_EXTENSION[extension]

export const cmsImageExtensionForMimeType = (
  mimeType: string
): Option.Option<CmsImageExtension> =>
  pipe(
    Record.toEntries(CONTENT_TYPE_BY_EXTENSION),
    Array.findFirst(([, contentType]) => contentType === mimeType),
    Option.map(([extension]) => extension)
  )

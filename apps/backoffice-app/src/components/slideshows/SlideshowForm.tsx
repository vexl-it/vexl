'use client'

import {getAdminToken} from '@/src/services/adminTokenService'
import {
  requestSlideshowUpload,
  uploadFileToS3,
} from '@/src/services/slideshows/api'
import {
  SlideshowSlides,
  type FileExtension,
  type SlideshowSlide,
} from '@/src/services/slideshows/domain'
import {Array, Either, pipe, Schema} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useState} from 'react'

interface DraftImageSlide {
  readonly uuid: string
  readonly type: 'image'
  readonly url: string
  readonly s3Key: string
  readonly fit: 'cover' | 'contain'
  readonly durationSeconds: number
}

interface DraftVideoSlide {
  readonly uuid: string
  readonly type: 'video'
  readonly url: string
  readonly s3Key: string
  readonly durationSeconds: number
}

interface DraftWebsiteSlide {
  readonly uuid: string
  readonly type: 'website'
  readonly url: string
  readonly durationSeconds: number
}

type DraftSlide = DraftImageSlide | DraftVideoSlide | DraftWebsiteSlide

interface SubmitData {
  readonly name: string
  readonly publicSlug: string | null
  readonly isEnabled: boolean
  readonly slides: typeof SlideshowSlides.Type
}

interface Props {
  readonly slideshowUuid: string
  readonly initialName: string
  readonly initialPublicSlug: string | null
  readonly initialIsEnabled: boolean
  readonly initialSlides: readonly SlideshowSlide[]
  readonly submitLabel: string
  readonly submittingLabel: string
  readonly onSubmit: (data: SubmitData) => Promise<void>
}

const DEFAULT_DURATION_SECONDS = 15
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

const getFileExtension = (file: File): FileExtension | null => {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'png':
      return 'png'
    case 'jpg':
      return 'jpg'
    case 'jpeg':
      return 'jpeg'
    case 'webp':
      return 'webp'
    case 'mp4':
      return 'mp4'
    case 'webm':
      return 'webm'
    default:
      return null
  }
}

const isImageExtension = (extension: FileExtension): boolean =>
  extension === 'png' ||
  extension === 'jpg' ||
  extension === 'jpeg' ||
  extension === 'webp'

const isVideoExtension = (extension: FileExtension): boolean =>
  extension === 'mp4' || extension === 'webm'

const moveSlide = (
  slides: readonly DraftSlide[],
  fromIndex: number,
  toIndex: number
): readonly DraftSlide[] => {
  const next = globalThis.Array.from(slides)
  const moving = next[fromIndex]
  const target = next[toIndex]

  if (!moving || !target) return slides

  next[fromIndex] = target
  next[toIndex] = moving
  return next
}

const getDraftSlideError = (
  slide: DraftSlide,
  index: number
): string | null => {
  const slideLabel = `Slide ${index + 1}`

  if (
    !Number.isInteger(slide.durationSeconds) ||
    slide.durationSeconds < 1 ||
    slide.durationSeconds > 24 * 60 * 60
  ) {
    return `${slideLabel}: duration must be between 1 and 86400 seconds`
  }

  switch (slide.type) {
    case 'image':
      if (!slide.url || !slide.s3Key) {
        return `${slideLabel}: upload an image before saving`
      }
      return null
    case 'video':
      if (!slide.url || !slide.s3Key) {
        return `${slideLabel}: upload a video before saving`
      }
      return null
    case 'website':
      try {
        if (new URL(slide.url).protocol === 'https:') return null
      } catch {
        return `${slideLabel}: website URL must be a valid HTTPS URL`
      }

      return `${slideLabel}: website URL must be a valid HTTPS URL`
  }
}

const getDraftSlidesError = (slides: readonly DraftSlide[]): string | null => {
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index]
    if (!slide) continue

    const error = getDraftSlideError(slide, index)
    if (error) return error
  }

  return null
}

export function SlideshowForm({
  slideshowUuid,
  initialName,
  initialPublicSlug,
  initialIsEnabled,
  initialSlides,
  submitLabel,
  submittingLabel,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName)
  const [publicSlug, setPublicSlug] = useState(initialPublicSlug ?? '')
  const [isEnabled, setIsEnabled] = useState(initialIsEnabled)
  const [slides, setSlides] = useState<readonly DraftSlide[]>(initialSlides)
  const [saving, setSaving] = useState(false)
  const [uploadingSlideUuid, setUploadingSlideUuid] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const updateSlide = useCallback(
    (uuid: string, update: (slide: DraftSlide) => DraftSlide): void => {
      setSlides((current) =>
        pipe(
          current,
          Array.map((slide) => (slide.uuid === uuid ? update(slide) : slide))
        )
      )
    },
    []
  )

  const addImageSlide = useCallback((): void => {
    setSlides((current) => [
      ...current,
      {
        uuid: crypto.randomUUID(),
        type: 'image',
        url: '',
        s3Key: '',
        fit: 'cover',
        durationSeconds: DEFAULT_DURATION_SECONDS,
      },
    ])
  }, [])

  const addVideoSlide = useCallback((): void => {
    setSlides((current) => [
      ...current,
      {
        uuid: crypto.randomUUID(),
        type: 'video',
        url: '',
        s3Key: '',
        durationSeconds: DEFAULT_DURATION_SECONDS,
      },
    ])
  }, [])

  const addWebsiteSlide = useCallback((): void => {
    setSlides((current) => [
      ...current,
      {
        uuid: crypto.randomUUID(),
        type: 'website',
        url: 'https://',
        durationSeconds: DEFAULT_DURATION_SECONDS,
      },
    ])
  }, [])

  const removeSlide = useCallback((uuid: string): void => {
    setSlides((current) =>
      pipe(
        current,
        Array.filter((slide) => slide.uuid !== uuid)
      )
    )
  }, [])

  const uploadAsset = useCallback(
    async (slide: DraftImageSlide | DraftVideoSlide, file: File) => {
      const adminToken = getAdminToken()
      if (!adminToken) {
        router.push('/login')
        return
      }

      const fileExtension = getFileExtension(file)
      if (!fileExtension) {
        setError('Unsupported file type')
        return
      }

      if (slide.type === 'image' && !isImageExtension(fileExtension)) {
        setError('Image slides support PNG, JPG, JPEG, and WEBP files')
        return
      }

      if (slide.type === 'video' && !isVideoExtension(fileExtension)) {
        setError('Video slides support MP4 and WEBM files')
        return
      }

      setError(null)
      setUploadingSlideUuid(slide.uuid)

      try {
        const upload = await requestSlideshowUpload(adminToken, {
          slideshowUuid,
          fileExtension,
        })
        await uploadFileToS3(upload.presignedUrl, file)
        updateSlide(slide.uuid, (current) => {
          if (current.type === 'website') return current

          return {
            ...current,
            url: upload.assetUrl,
            s3Key: upload.s3Key,
          }
        })
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : 'Failed to upload asset'
        )
      } finally {
        setUploadingSlideUuid(null)
      }
    },
    [router, slideshowUuid, updateSlide]
  )

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const normalizedPublicSlug = publicSlug.trim().toLowerCase()
    if (normalizedPublicSlug && !SLUG_PATTERN.test(normalizedPublicSlug)) {
      setError(
        'Public slug must be 3-32 characters, using lowercase letters, numbers, and hyphens'
      )
      return
    }

    const draftSlidesError = getDraftSlidesError(slides)
    if (draftSlidesError) {
      setError(draftSlidesError)
      return
    }

    const decodedSlides = Schema.decodeUnknownEither(SlideshowSlides)(slides)

    if (Either.isLeft(decodedSlides)) {
      setError('Slides contain invalid data')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSubmit({
        name: name.trim(),
        publicSlug: normalizedPublicSlug || null,
        isEnabled,
        slides: decodedSlides.right,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to save slideshow'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="slideshow-name"
              className="block text-sm font-medium text-gray-700"
            >
              Name *
            </label>
            <input
              id="slideshow-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label
              htmlFor="slideshow-public-slug"
              className="block text-sm font-medium text-gray-700"
            >
              Public slug
            </label>
            <input
              id="slideshow-public-slug"
              type="text"
              value={publicSlug}
              onChange={(event) => {
                setPublicSlug(event.target.value.toLowerCase())
              }}
              placeholder="office-tv"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
            <div className="mt-1 text-xs text-gray-500">
              Optional. Use lowercase letters, numbers, and hyphens.
            </div>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => {
                  setIsEnabled(event.target.checked)
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enabled
            </label>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Slides</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addImageSlide}
                className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Add image
              </button>
              <button
                type="button"
                onClick={addVideoSlide}
                className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Add video
              </button>
              <button
                type="button"
                onClick={addWebsiteSlide}
                className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Add website
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {slides.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                No slides
              </div>
            ) : (
              pipe(
                slides,
                Array.map((slide, index) => (
                  <div
                    key={slide.uuid}
                    className="rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold uppercase text-gray-500">
                          {index + 1}. {slide.type}
                        </div>
                        <div className="mt-1 font-mono text-xs text-gray-400">
                          {slide.uuid}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSlides((current) =>
                              moveSlide(current, index, index - 1)
                            )
                          }}
                          disabled={index === 0}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSlides((current) =>
                              moveSlide(current, index, index + 1)
                            )
                          }}
                          disabled={index === slides.length - 1}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeSlide(slide.uuid)
                          }}
                          className="rounded-md border border-red-200 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div>
                        <label
                          htmlFor={`duration-${slide.uuid}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Duration seconds
                        </label>
                        <input
                          id={`duration-${slide.uuid}`}
                          type="number"
                          min="1"
                          value={slide.durationSeconds}
                          onChange={(event) => {
                            const nextDuration = Number(event.target.value)
                            updateSlide(slide.uuid, (current) => ({
                              ...current,
                              durationSeconds: nextDuration,
                            }))
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border"
                        />
                      </div>

                      {slide.type === 'image' && (
                        <div>
                          <label
                            htmlFor={`fit-${slide.uuid}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Fit
                          </label>
                          <select
                            id={`fit-${slide.uuid}`}
                            value={slide.fit}
                            onChange={(event) => {
                              const fit =
                                event.target.value === 'contain'
                                  ? 'contain'
                                  : 'cover'
                              updateSlide(slide.uuid, (current) =>
                                current.type === 'image'
                                  ? {...current, fit}
                                  : current
                              )
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border"
                          >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                          </select>
                        </div>
                      )}

                      {slide.type === 'website' ? (
                        <div className="lg:col-span-2">
                          <label
                            htmlFor={`url-${slide.uuid}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            HTTPS URL
                          </label>
                          <input
                            id={`url-${slide.uuid}`}
                            type="url"
                            value={slide.url}
                            onChange={(event) => {
                              updateSlide(slide.uuid, (current) =>
                                current.type === 'website'
                                  ? {...current, url: event.target.value}
                                  : current
                              )
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border"
                            required
                          />
                        </div>
                      ) : (
                        <div className="lg:col-span-2">
                          <label
                            htmlFor={`file-${slide.uuid}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Asset
                          </label>
                          <input
                            id={`file-${slide.uuid}`}
                            type="file"
                            accept={
                              slide.type === 'image'
                                ? '.png,.jpg,.jpeg,.webp'
                                : '.mp4,.webm'
                            }
                            disabled={uploadingSlideUuid === slide.uuid}
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              event.currentTarget.value = ''
                              if (!file) return
                              void uploadAsset(slide, file)
                            }}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                          />
                          {!!slide.url && (
                            <div className="mt-2 break-all text-xs text-gray-500">
                              {slide.url}
                            </div>
                          )}
                          {uploadingSlideUuid === slide.uuid && (
                            <div className="mt-2 text-sm text-gray-500">
                              Uploading...
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {slide.type === 'image' && !!slide.url && (
                      <img
                        src={slide.url}
                        alt=""
                        className="mt-4 h-32 w-56 rounded-md bg-gray-100 object-cover"
                      />
                    )}
                    {slide.type === 'video' && !!slide.url && (
                      <video
                        src={slide.url}
                        className="mt-4 h-32 w-56 rounded-md bg-black object-contain"
                        controls
                        muted
                        playsInline
                      />
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {!!error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              router.push('/slideshows')
            }}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploadingSlideUuid !== null}
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

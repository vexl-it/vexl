'use client'

import {SlideshowForm} from '@/src/components/slideshows/SlideshowForm'
import {getAdminToken} from '@/src/services/adminTokenService'
import {copyToClipboard} from '@/src/services/clipboard'
import {
  getSlideshow,
  regenerateSlideshowToken,
  updateSlideshow,
} from '@/src/services/slideshows/api'
import {
  type SlideshowSlides,
  type TvSlideshow,
} from '@/src/services/slideshows/domain'
import {useParams, useRouter} from 'next/navigation'
import {useCallback, useEffect, useRef, useState} from 'react'

interface SubmitData {
  readonly name: string
  readonly publicSlug: string | null
  readonly isEnabled: boolean
  readonly slides: SlideshowSlides
}

const getPublicPath = (slideshow: TvSlideshow): string =>
  `/tv/slideshows/${slideshow.publicSlug ?? slideshow.publicToken}`

export default function EditSlideshowPage() {
  const params = useParams<{uuid: string}>()
  const [slideshow, setSlideshow] = useState<TvSlideshow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [manualCopyUrl, setManualCopyUrl] = useState<string | null>(null)
  const manualCopyInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const loadSlideshow = useCallback(async () => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getSlideshow(adminToken, params.uuid)
      setSlideshow(result.slideshow)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load slideshow'
      )
    } finally {
      setLoading(false)
    }
  }, [params.uuid, router])

  useEffect(() => {
    void loadSlideshow()
  }, [loadSlideshow])

  useEffect(() => {
    if (!manualCopyUrl) return

    manualCopyInputRef.current?.focus()
    manualCopyInputRef.current?.select()
  }, [manualCopyUrl])

  const handleSubmit = async (data: SubmitData) => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    const result = await updateSlideshow(adminToken, params.uuid, {
      name: data.name,
      publicSlug: data.publicSlug,
      isEnabled: data.isEnabled,
      slides: data.slides,
    })

    setSlideshow(result.slideshow)
    router.push('/slideshows')
  }

  const handleRegenerateToken = async () => {
    if (!window.confirm('Regenerate the public TV URL?')) return

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    try {
      const result = await regenerateSlideshowToken(adminToken, params.uuid)
      setSlideshow(result.slideshow)
      setCopied(false)
    } catch (regenerateError) {
      setError(
        regenerateError instanceof Error
          ? regenerateError.message
          : 'Failed to regenerate token'
      )
    }
  }

  const handleCopyUrl = async () => {
    if (!slideshow) return
    const tvUrl = `${window.location.origin}${getPublicPath(slideshow)}`

    try {
      await copyToClipboard(tvUrl)
      setError(null)
      setManualCopyUrl(null)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setManualCopyUrl(tvUrl)
      setError('Clipboard copy is blocked. Select the TV URL below.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Loading slideshow...</div>
      </div>
    )
  }

  if (!slideshow) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error ?? 'Slideshow not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-start sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit slideshow
          </h1>
          <p className="mt-2 break-all text-sm text-gray-700">
            {getPublicPath(slideshow)}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              void handleCopyUrl()
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {copied ? 'Copied' : 'Copy TV URL'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleRegenerateToken()
            }}
            className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
          >
            Regenerate URL
          </button>
        </div>
      </div>

      {!!error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
          {!!manualCopyUrl && (
            <input
              ref={manualCopyInputRef}
              readOnly
              value={manualCopyUrl}
              onFocus={(event) => {
                event.target.select()
              }}
              className="mt-3 block w-full rounded-md border border-red-200 bg-white px-3 py-2 font-mono text-xs text-red-950"
            />
          )}
        </div>
      )}

      <SlideshowForm
        key={slideshow.uuid}
        slideshowUuid={slideshow.uuid}
        initialName={slideshow.name}
        initialPublicSlug={slideshow.publicSlug}
        initialIsEnabled={slideshow.isEnabled}
        initialSlides={slideshow.slides}
        submitLabel="Save changes"
        submittingLabel="Saving..."
        onSubmit={handleSubmit}
      />
    </div>
  )
}

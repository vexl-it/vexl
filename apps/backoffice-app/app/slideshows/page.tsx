'use client'

import {getAdminToken} from '@/src/services/adminTokenService'
import {copyToClipboard} from '@/src/services/clipboard'
import {
  deleteSlideshow,
  duplicateSlideshow,
  listSlideshows,
} from '@/src/services/slideshows/api'
import {type TvSlideshow} from '@/src/services/slideshows/domain'
import {Array, pipe} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useRef, useState} from 'react'

const getPublicIdentifier = (slideshow: TvSlideshow): string =>
  slideshow.publicSlug ?? slideshow.publicToken

const getTvUrl = (slideshow: TvSlideshow): string =>
  `${window.location.origin}/tv/slideshows/${getPublicIdentifier(slideshow)}`

export default function SlideshowsPage() {
  const [slideshows, setSlideshows] = useState<readonly TvSlideshow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null)
  const [manualCopyUrl, setManualCopyUrl] = useState<string | null>(null)
  const manualCopyInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const loadSlideshows = useCallback(async () => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await listSlideshows(adminToken)
      setSlideshows(result.slideshows)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load slideshows'
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadSlideshows()
  }, [loadSlideshows])

  useEffect(() => {
    if (!manualCopyUrl) return

    manualCopyInputRef.current?.focus()
    manualCopyInputRef.current?.select()
  }, [manualCopyUrl])

  const handleCopyUrl = async (slideshow: TvSlideshow) => {
    const publicIdentifier = getPublicIdentifier(slideshow)
    const tvUrl = getTvUrl(slideshow)

    try {
      await copyToClipboard(tvUrl)
      setError(null)
      setManualCopyUrl(null)
      setCopiedIdentifier(publicIdentifier)
      window.setTimeout(() => {
        setCopiedIdentifier(null)
      }, 1500)
    } catch {
      setManualCopyUrl(tvUrl)
      setError('Clipboard copy is blocked. Select the TV URL below.')
    }
  }

  const handleDuplicate = async (slideshow: TvSlideshow) => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    try {
      const result = await duplicateSlideshow(adminToken, slideshow.uuid)
      router.push(`/slideshows/${result.slideshow.uuid}/edit`)
    } catch (duplicateError) {
      setError(
        duplicateError instanceof Error
          ? duplicateError.message
          : 'Failed to duplicate slideshow'
      )
    }
  }

  const handleDelete = async (slideshow: TvSlideshow) => {
    if (!window.confirm(`Delete "${slideshow.name}"?`)) return

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    try {
      await deleteSlideshow(adminToken, slideshow.uuid)
      setSlideshows((current) =>
        pipe(
          current,
          Array.filter(
            (currentSlideshow) => currentSlideshow.uuid !== slideshow.uuid
          )
        )
      )
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete slideshow'
      )
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Loading slideshows...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            TV slideshows
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Slideshow configurations for public TV display URLs
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => {
              router.push('/slideshows/create')
            }}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Create slideshow
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

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {slideshows.length === 0 ? (
              <div className="rounded-lg bg-white py-12 text-center shadow">
                <p className="text-gray-500">No slideshows found</p>
                <button
                  onClick={() => {
                    router.push('/slideshows/create')
                  }}
                  className="mt-4 text-indigo-600 underline hover:text-indigo-800"
                >
                  Create slideshow
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-300 overflow-hidden rounded-lg bg-white shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Slides
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Updated
                    </th>
                    <th className="relative px-3 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {pipe(
                    slideshows,
                    Array.map((slideshow) => (
                      <tr key={slideshow.uuid}>
                        <td className="px-3 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {slideshow.name}
                          </div>
                          <div className="font-mono text-xs text-gray-500">
                            {slideshow.uuid}
                          </div>
                          {!!slideshow.publicSlug && (
                            <div className="mt-1 font-mono text-xs text-indigo-700">
                              /tv/slideshows/{slideshow.publicSlug}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              slideshow.isEnabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {slideshow.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {slideshow.slides.length}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(slideshow.updatedAt).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              onClick={() => {
                                router.push(
                                  `/slideshows/${slideshow.uuid}/edit`
                                )
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                void handleCopyUrl(slideshow)
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {copiedIdentifier ===
                              getPublicIdentifier(slideshow)
                                ? 'Copied'
                                : 'Copy URL'}
                            </button>
                            <button
                              onClick={() => {
                                void handleDuplicate(slideshow)
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => {
                                void handleDelete(slideshow)
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

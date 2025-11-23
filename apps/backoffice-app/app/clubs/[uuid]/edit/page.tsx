'use client'

import {useClubImageUpload} from '@/src/hooks/useClubImageUpload'
import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {makeClubsAdminClient} from '@/src/services/clubsAdminApi'
import type {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {Option} from 'effect'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

export default function EditClubPage() {
  const params = useParams()
  const clubUuid = params.uuid as string
  const [formData, setFormData] = useState<ClubInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const runEffect = useRunEffect()
  const router = useRouter()

  const {
    selectedFile,
    previewUrl,
    uploading,
    uploadProgress,
    uploadedImageUrl,
    error: uploadError,
    handleFileSelect,
    uploadImage,
    resetUpload,
  } = useClubImageUpload()

  // Auto-populate clubImageUrl when image is uploaded
  useEffect(() => {
    if (uploadedImageUrl && formData) {
      setFormData((prev) =>
        prev ? {...prev, clubImageUrl: uploadedImageUrl as any} : prev
      )
    }
  }, [uploadedImageUrl, formData])

  useEffect(() => {
    const loadClub = async () => {
      const adminToken = getAdminToken()
      if (!adminToken) {
        router.push('/login')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const client = await runEffect(makeClubsAdminClient())
        const result = await runEffect(
          client.listClubs({urlParams: {adminToken}})
        )
        const club = result.clubs.find((c) => c.uuid === clubUuid)

        if (!club) {
          setError('Club not found')
          return
        }

        setFormData(club as any)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load club')
      } finally {
        setLoading(false)
      }
    }

    void loadClub()
  }, [clubUuid, runEffect, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setError(null)
    setSaving(true)

    try {
      const client = await runEffect(makeClubsAdminClient())
      await runEffect(
        client.modifyClub({
          urlParams: {adminToken},
          payload: {clubInfo: formData as any},
        })
      )
      router.push('/clubs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update club')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading club...</div>
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => {
              router.push('/clubs')
            }}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (!formData) return <></>

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Club</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update the club details below
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              UUID
            </label>
            <input
              type="text"
              value={formData.uuid}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value})
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={
                formData.description._tag === 'Some'
                  ? formData.description.value
                  : ''
              }
              onChange={(e) => {
                setFormData({
                  ...formData,
                  description: e.target.value
                    ? Option.some(e.target.value)
                    : Option.none(),
                })
              }}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label
              htmlFor="membersCountLimit"
              className="block text-sm font-medium text-gray-700"
            >
              Members Count Limit *
            </label>
            <input
              type="number"
              id="membersCountLimit"
              value={formData.membersCountLimit}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  membersCountLimit: parseInt(e.target.value, 10),
                })
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              required
              min="1"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Club Image
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileSelect}
                disabled={uploading || !!uploadedImageUrl}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                PNG, JPG, or JPEG (max 10MB)
              </p>
            </div>

            {previewUrl && !uploadedImageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-xs rounded-lg shadow-md"
                />
              </div>
            )}

            {uploading && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Progress
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{width: `${uploadProgress}%`}}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-500 text-center">
                  {uploadProgress}%
                </p>
              </div>
            )}

            {selectedFile && !uploadedImageUrl && !uploading && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void uploadImage()
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            )}

            {uploadedImageUrl && (
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Image uploaded successfully!
                </p>
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded"
                  className="max-w-xs rounded-lg shadow-md mb-2"
                />
                <button
                  type="button"
                  onClick={resetUpload}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Upload Different Image
                </button>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-800 text-sm">{uploadError}</p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="clubImageUrl"
              className="block text-sm font-medium text-gray-700"
            >
              Club Image URL *
            </label>
            <input
              type="url"
              id="clubImageUrl"
              value={formData.clubImageUrl}
              onChange={(e) => {
                setFormData({...formData, clubImageUrl: e.target.value as any})
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="https://example.com/image.jpg"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Auto-filled when you upload an image above, or enter URL manually
            </p>
            {formData.clubImageUrl && !uploadedImageUrl && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Current Image:
                </p>
                <img
                  src={formData.clubImageUrl}
                  alt="Club"
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="validUntil"
              className="block text-sm font-medium text-gray-700"
            >
              Valid Until *
            </label>
            <input
              type="date"
              id="validUntil"
              value={
                formData.validUntil instanceof Date
                  ? formData.validUntil.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => {
                setFormData({
                  ...formData,
                  validUntil: new Date(e.target.value),
                })
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label
              htmlFor="reportLimit"
              className="block text-sm font-medium text-gray-700"
            >
              Report Limit
            </label>
            <input
              type="number"
              id="reportLimit"
              value={formData.reportLimit}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  reportLimit: parseInt(e.target.value, 10),
                })
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              min="0"
            />
          </div>

          {error && formData && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                router.push('/clubs')
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

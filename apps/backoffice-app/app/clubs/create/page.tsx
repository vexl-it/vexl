'use client'

import {useClubImageUpload} from '@/src/hooks/useClubImageUpload'
import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {makeClubsAdminClient} from '@/src/services/clubsAdminApi'
import {Option} from 'effect'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

export default function CreateClubPage() {
  const [formData, setFormData] = useState({
    uuid: crypto.randomUUID(),
    name: '',
    description: '',
    membersCountLimit: 100,
    clubImageUrl: '',
    validUntil:
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0] ?? '',
    reportLimit: 0,
  })
  const [loading, setLoading] = useState(false)
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
    if (uploadedImageUrl) {
      setFormData((prev) => ({...prev, clubImageUrl: uploadedImageUrl}))
    }
  }, [uploadedImageUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const client = await runEffect(makeClubsAdminClient())
      await runEffect(
        client.createClub({
          urlParams: {adminToken},
          payload: {
            club: {
              uuid: formData.uuid as any,
              name: formData.name,
              description: formData.description
                ? Option.some(formData.description)
                : Option.none(),
              membersCountLimit: formData.membersCountLimit,
              clubImageUrl: formData.clubImageUrl as any,
              validUntil: new Date(formData.validUntil),
              reportLimit: formData.reportLimit,
            },
          },
        })
      )
      router.push('/clubs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create New Club
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Fill in the details to create a new club
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          <div>
            <label
              htmlFor="uuid"
              className="block text-sm font-medium text-gray-700"
            >
              UUID
            </label>
            <input
              type="text"
              id="uuid"
              value={formData.uuid}
              onChange={(e) => {
                setFormData({...formData, uuid: e.target.value as any})
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              required
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
              value={formData.description}
              onChange={(e) => {
                setFormData({...formData, description: e.target.value})
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
                setFormData({...formData, clubImageUrl: e.target.value})
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="https://example.com/image.jpg"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Auto-filled when you upload an image above, or enter URL manually
            </p>
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
              value={formData.validUntil}
              onChange={(e) => {
                setFormData({...formData, validUntil: e.target.value})
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

          {error && (
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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

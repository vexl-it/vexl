'use client'

import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {makeClubsAdminClient} from '@/src/services/clubsAdminApi'
import {ClubUuid, type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'
import {useRouter} from 'next/navigation'
import {QRCodeSVG} from 'qrcode.react'
import {useCallback, useEffect, useState} from 'react'

export default function GenerateLinkPage() {
  const [clubs, setClubs] = useState<readonly ClubInfo[]>([])
  const [selectedClubUuid, setSelectedClubUuid] = useState<
    ClubUuid | undefined
  >(undefined)
  const [generatedLink, setGeneratedLink] = useState<{
    code: string
    fullLink: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const runEffect = useRunEffect()
  const router = useRouter()

  const loadClubs = useCallback(async (): Promise<void> => {
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
      setClubs(result.clubs)
      if (result.clubs.length > 0) {
        setSelectedClubUuid(result.clubs[0]?.uuid ?? '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }, [runEffect, router])

  useEffect(() => {
    void loadClubs()
  }, [loadClubs])

  const handleGenerate = async (): Promise<void> => {
    if (!selectedClubUuid) {
      setError('Please select a club')
      return
    }

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setGenerating(true)
    setError(null)
    setGeneratedLink(null)
    setCopiedCode(false)
    setCopiedLink(false)

    try {
      const client = await runEffect(makeClubsAdminClient())
      const result = await runEffect(
        client.generateClubInviteLinkForAdmin({
          urlParams: {adminToken},
          payload: {clubUuid: selectedClubUuid},
        })
      )
      setGeneratedLink({
        code: result.link.code,
        fullLink: result.link.fullLink,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate invite link'
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = async (): Promise<void> => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink.code)
      setCopiedCode(true)
      setTimeout(() => {
        setCopiedCode(false)
      }, 2000)
    } catch {
      setError('Failed to copy code to clipboard')
    }
  }

  const handleCopyLink = async (): Promise<void> => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink.fullLink)
      setCopiedLink(true)
      setTimeout(() => {
        setCopiedLink(false)
      }, 2000)
    } catch {
      setError('Failed to copy link to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading clubs...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Generate Club Invite Link
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Select a club and generate an invite link for admin access
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-2xl">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {clubs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No clubs available</p>
              <button
                onClick={() => {
                  router.push('/clubs')
                }}
                className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
              >
                Go back
              </button>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="club"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Club *
                </label>
                <select
                  id="club"
                  value={selectedClubUuid}
                  onChange={(e) => {
                    setSelectedClubUuid(
                      Schema.decodeSync(ClubUuid)(e.target.value)
                    )
                    setGeneratedLink(null)
                    setCopiedCode(false)
                    setCopiedLink(false)
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                >
                  {clubs.map((club) => (
                    <option key={club.uuid} value={club.uuid}>
                      {club.name} ({club.uuid})
                    </option>
                  ))}
                </select>
              </div>

              {!!error && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {!!generatedLink && (
                <div className="bg-green-50 p-4 rounded-md space-y-3">
                  <p className="text-sm font-medium text-green-900">
                    Invite link generated successfully!
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-green-900 mb-1">
                      Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink.code}
                        readOnly
                        className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          void handleCopyCode()
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-900 mb-1">
                      Full Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink.fullLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          void handleCopyLink()
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCodeSVG
                        value={generatedLink.fullLink}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>
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
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleGenerate()
                  }}
                  disabled={generating || !selectedClubUuid}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Link'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

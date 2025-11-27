'use client'

import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {makeClubsAdminClient} from '@/src/services/clubsAdminApi'
import type {ClubInfoAdmin} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Option} from 'effect'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

export default function ClubsListPage() {
  const [clubs, setClubs] = useState<readonly ClubInfoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredDescription, setHoveredDescription] = useState<string | null>(
    null
  )
  const [tooltipPosition, setTooltipPosition] = useState({x: 0, y: 0})
  const runEffect = useRunEffect()
  const router = useRouter()

  // Truncate helper for descriptions
  const truncate = (s: string, n = 50) =>
    s.length > n ? `${s.slice(0, n)}…` : s

  const handleMouseEnter = (description: string, e: React.MouseEvent) => {
    setHoveredDescription(description)
    setTooltipPosition({x: e.clientX, y: e.clientY})
  }

  const handleMouseLeave = () => {
    setHoveredDescription(null)
  }

  useEffect(() => {
    const loadClubs = async () => {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clubs')
      } finally {
        setLoading(false)
      }
    }

    void loadClubs()
  }, [runEffect, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading clubs...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={() => {
            window.location.reload()
          }}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Clubs</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all clubs in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              router.push('/clubs/create')
            }}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Club
          </button>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {clubs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No clubs found</p>
                <button
                  onClick={() => {
                    router.push('/clubs/create')
                  }}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
                >
                  Create your first club
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-300 bg-white shadow-sm rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      UUID
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Members Limit
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Valid Until
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Report Limit
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Admin Note
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clubs.map((club) => (
                    <tr key={club.uuid}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="flex items-center">
                          {club.clubImageUrl && (
                            <img
                              src={club.clubImageUrl}
                              alt={club.name}
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {club.name}
                            </div>
                            {club.description._tag === 'Some' && (
                              <div
                                className="text-gray-500 cursor-help"
                                onMouseEnter={(e) => {
                                  handleMouseEnter(
                                    Option.getOrElse(
                                      club.description,
                                      () => ''
                                    ),
                                    e
                                  )
                                }}
                                onMouseLeave={handleMouseLeave}
                              >
                                {truncate(club.description.value, 50)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                        {club.uuid}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {club.membersCountLimit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(club.validUntil).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {club.reportLimit}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
                        {club.adminNote && club.adminNote._tag === 'Some' ? (
                          <div className="text-gray-700 italic">
                            {club.adminNote.value}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            router.push(`/clubs/${club.uuid}/edit`)
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {hoveredDescription && (
        <div
          className="fixed z-50 max-w-xs bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          {hoveredDescription}
        </div>
      )}
    </div>
  )
}

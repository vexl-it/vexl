'use client'

import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {makeClubsAdminClient} from '@/src/services/clubsAdminApi'
import type {ClubAdminInfo} from '@vexl-next/domain/src/general/clubs'
import type {ClubCannotBeReactivatedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useState} from 'react'

const REACTIVATION_WARNING =
  'Reactivating is not recommended: members were already notified about the deactivation and most of them will have the club data erased from their devices, so reactivating will not restore the club for them. Reactivate anyway?'

const getReactivationErrorMessage = (
  error: ClubCannotBeReactivatedError
): string => {
  switch (error.reactivationBlockedReason) {
    case 'PAST_VALIDITY':
      return 'Cannot reactivate: the club is past its validity date. Edit the club and extend "Valid until" first, then reactivate.'
    case 'REPORT_LIMIT_REACHED':
      return "Cannot reactivate: the club's report count has reached its report limit, so it would be deactivated again immediately. Edit the club and increase the report limit first, then reactivate."
  }
}

export default function ClubsListPage() {
  const [clubs, setClubs] = useState<readonly ClubAdminInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [reactivatingClubUuid, setReactivatingClubUuid] = useState<
    string | null
  >(null)
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
        client.listClubs({headers: {'x-admin-token': adminToken}})
      )
      setClubs(result.clubs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }, [runEffect, router])

  useEffect(() => {
    void loadClubs()
  }, [loadClubs])

  const handleReactivate = async (club: ClubAdminInfo): Promise<void> => {
    if (!window.confirm(REACTIVATION_WARNING)) return

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setReactivatingClubUuid(club.uuid)
    setError(null)

    try {
      const client = await runEffect(makeClubsAdminClient())
      const blockedMessage = await runEffect(
        client
          .reactivateClub({
            headers: {'x-admin-token': adminToken},
            payload: {clubUuid: club.uuid},
          })
          .pipe(
            Effect.map(() => null),
            Effect.catchTag('ClubCannotBeReactivatedError', (e) =>
              Effect.succeed(getReactivationErrorMessage(e))
            )
          )
      )
      if (blockedMessage !== null) {
        setError(blockedMessage)
        return
      }
      await loadClubs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate club')
    } finally {
      setReactivatingClubUuid(null)
    }
  }

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
                      Members
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Δ 30d
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Valid Until
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Reports
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
                          {!!club.clubImageUrl && (
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
                        {club.membersCount} / {club.membersCountLimit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {club.membersJoinedLast30Days === 0 &&
                        club.membersLeftLast30Days === 0 ? (
                          <span className="text-gray-500">+0 / -0</span>
                        ) : (
                          <>
                            <span className="text-green-700">
                              +{club.membersJoinedLast30Days}
                            </span>{' '}
                            <span className="text-gray-500">/</span>{' '}
                            <span className="text-red-700">
                              -{club.membersLeftLast30Days}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(club.validUntil).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {Option.isSome(club.madeInactiveAt) ? (
                          <div>
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              Inactive
                            </span>
                            <div className="mt-1 text-xs text-red-700">
                              {Option.getOrElse(
                                club.madeInactiveReason,
                                () => 'UNKNOWN'
                              )}
                              ,{' '}
                              {club.madeInactiveAt.value
                                .toISOString()
                                .slice(0, 10)}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {club.report} / {club.reportLimit}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-3">
                          {Option.isSome(club.madeInactiveAt) && (
                            <button
                              onClick={() => {
                                void handleReactivate(club)
                              }}
                              disabled={reactivatingClubUuid === club.uuid}
                              className="text-green-700 hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {reactivatingClubUuid === club.uuid
                                ? 'Reactivating...'
                                : 'Reactivate'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              router.push(`/clubs/${club.uuid}/edit`)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {!!hoveredDescription && (
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

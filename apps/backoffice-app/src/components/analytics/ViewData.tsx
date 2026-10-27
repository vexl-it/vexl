'use client'

import {getAdminToken} from '@/src/services/adminTokenService'
import {getAnalyticsView} from '@/src/services/analytics/api'
import {
  type AnalyticsView,
  type AnalyticsViewData,
} from '@/src/services/analytics/domain'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {useAnalyticsFilters} from './filtersContext'

interface LoadState<A> {
  readonly data: A | null
  readonly error: string | null
  readonly loading: boolean
}

// Loads one view's numbers for the current filters; while new filters load,
// the previous numbers stay on screen, faded
export function ViewData<V extends AnalyticsView>({
  view,
  children,
}: {
  view: V
  children: (data: AnalyticsViewData[V]) => React.ReactNode
}) {
  const router = useRouter()
  const {filters} = useAnalyticsFilters()
  const [state, setState] = useState<LoadState<AnalyticsViewData[V]>>({
    data: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    let cancelled = false
    setState((previous) => ({...previous, error: null, loading: true}))
    getAnalyticsView(adminToken, view, filters)
      .then((data) => {
        if (!cancelled) setState({data, error: null, loading: false})
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load analytics',
        }))
      })
    return () => {
      cancelled = true
    }
  }, [router, view, filters])

  if (state.error !== null)
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
        {state.error}
      </div>
    )
  if (state.data === null)
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-600">
        Loading analytics...
      </div>
    )
  return (
    <div className={state.loading ? 'opacity-60 transition-opacity' : ''}>
      {children(state.data)}
    </div>
  )
}

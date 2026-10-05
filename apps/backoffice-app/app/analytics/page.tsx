'use client'

import {ActivationChart} from '@/src/components/analytics/ActivationChart'
import {MarketplaceChart} from '@/src/components/analytics/MarketplaceChart'
import {OnboardingFunnelChart} from '@/src/components/analytics/OnboardingFunnelChart'
import {getAdminToken} from '@/src/services/adminTokenService'
import {getAnalyticsDashboard} from '@/src/services/analytics/api'
import {type AnalyticsDashboard} from '@/src/services/analytics/domain'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

export default function AnalyticsPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    getAnalyticsDashboard(adminToken)
      .then(setDashboard)
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load analytics'
        )
      })
  }, [router])

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
      <p className="mt-2 text-sm text-gray-700">
        Privacy-aware app analytics. Every number counts reporting instances,
        never users, in UTC calendar weeks.
      </p>

      {!!error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {dashboard === null ? (
        !error && (
          <div className="flex h-64 items-center justify-center text-gray-600">
            Loading analytics...
          </div>
        )
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <OnboardingFunnelChart
            report={dashboard.onboarding}
            minGroupSize={dashboard.minGroupSize}
          />
          <ActivationChart
            report={dashboard.registration}
            minGroupSize={dashboard.minGroupSize}
          />
          <MarketplaceChart
            report={dashboard.marketplace}
            minGroupSize={dashboard.minGroupSize}
          />
        </div>
      )}
    </div>
  )
}

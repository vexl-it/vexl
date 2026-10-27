'use client'

import {getAdminToken} from '@/src/services/adminTokenService'
import {getAnalyticsCountries} from '@/src/services/analytics/api'
import {
  PERIOD_OPTIONS,
  PLATFORM_OPTIONS,
  RANGE_OPTIONS,
  rangeShown,
  type CountryOption,
} from '@/src/services/analytics/domain'
import {Array, Option, pipe} from 'effect'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {FilterSelect} from './charts'
import {AnalyticsFiltersProvider, useAnalyticsFilters} from './filtersContext'
import {ANALYTICS_VIEWS} from './views'

const ALL_COUNTRIES: readonly CountryOption[] = [
  {value: 'all', label: 'All countries'},
]

// The largest countries come from the data, so the list loads with the page
function useCountryOptions(): readonly CountryOption[] {
  const [countries, setCountries] = useState(ALL_COUNTRIES)
  useEffect(() => {
    const adminToken = getAdminToken()
    if (!adminToken) return
    getAnalyticsCountries(adminToken)
      .then((response) => {
        setCountries(response.countries)
      })
      .catch(() => {
        // The views report the failure; the filter keeps "All countries"
      })
  }, [])
  return countries
}

function Filters() {
  const {filters, setFilters} = useAnalyticsFilters()
  const countries = useCountryOptions()
  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect
        label="Period"
        value={filters.period}
        options={PERIOD_OPTIONS}
        onChange={(period) => {
          setFilters({...filters, period})
        }}
      />
      <FilterSelect
        label="Range"
        value={filters.range}
        options={RANGE_OPTIONS}
        hint={
          rangeShown(filters) === filters.range
            ? undefined
            : 'by day: last 90 days only'
        }
        onChange={(range) => {
          setFilters({...filters, range})
        }}
      />
      <FilterSelect
        label="Country (phone prefix)"
        value={filters.country}
        options={countries}
        onChange={(country) => {
          setFilters({...filters, country})
        }}
      />
      <FilterSelect
        label="Platform"
        value={filters.platform}
        options={PLATFORM_OPTIONS}
        onChange={(platform) => {
          setFilters({...filters, platform})
        }}
      />
    </div>
  )
}

export function AnalyticsShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname()
  const current = pipe(
    ANALYTICS_VIEWS,
    Array.findFirst((view) => pathname === `/analytics/${view.slug}`),
    Option.getOrNull
  )

  return (
    <AnalyticsFiltersProvider>
      <div className="space-y-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            We count app installs, never people: one phone is one install.
            Groups smaller than 20 are hidden and show as &lt;20, or n/a for a
            percentage. Dashed lines and faded bars are recent periods whose
            data is still coming in. &quot;All users&quot; numbers come from our
            servers and &quot;Installs with analytics on&quot; numbers from the
            apps; they cover different groups, so we never divide one by the
            other.
          </p>
          <p className="mt-1 text-sm text-gray-700">
            <span className="font-medium">Core action</span> = created an offer,
            sent a request or approved a request.{' '}
            <span className="font-medium">Activated</span> = created a first
            offer or sent a first request in the main marketplace within 30 days
            of registering.
          </p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6 overflow-x-auto">
            {Array.map(ANALYTICS_VIEWS, (view) => (
              <Link
                key={view.slug}
                href={`/analytics/${view.slug}`}
                className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                  current?.slug === view.slug
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {view.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          {current ? (
            <p className="text-sm font-medium text-gray-900">
              {current.question}
            </p>
          ) : null}
          <Filters />
        </div>

        {children}
      </div>
    </AnalyticsFiltersProvider>
  )
}

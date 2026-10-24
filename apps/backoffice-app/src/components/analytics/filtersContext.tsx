'use client'

import {type AnalyticsFilters} from '@/src/services/analytics/domain'
import {createContext, useContext, useState} from 'react'

interface FiltersState {
  readonly filters: AnalyticsFilters
  readonly setFilters: (filters: AnalyticsFilters) => void
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  period: 'week',
  range: '12m',
  country: 'all',
  platform: 'all',
}

const FiltersContext = createContext<FiltersState>({
  filters: DEFAULT_FILTERS,
  setFilters: () => {},
})

export function AnalyticsFiltersProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  return (
    <FiltersContext.Provider value={{filters, setFilters}}>
      {children}
    </FiltersContext.Provider>
  )
}

export const useAnalyticsFilters = (): FiltersState =>
  useContext(FiltersContext)

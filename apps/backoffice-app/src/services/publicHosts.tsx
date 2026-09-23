'use client'

import {createContext, useContext} from 'react'

export interface PublicHosts {
  readonly shortLinks: string
  readonly slideshows: string
}

const PublicHostsContext = createContext<PublicHosts | null>(null)

export function PublicHostsProvider({
  hosts,
  children,
}: {
  readonly hosts: PublicHosts
  readonly children: React.ReactNode
}) {
  return (
    <PublicHostsContext.Provider value={hosts}>
      {children}
    </PublicHostsContext.Provider>
  )
}

export const usePublicHosts = (): PublicHosts => {
  const hosts = useContext(PublicHostsContext)
  if (!hosts) throw new Error('PublicHostsProvider is missing')
  return hosts
}

export const publicUrl = (host: string, path: string): string =>
  `https://${host}/${path}`

import {SiteDocument} from '@/src/components/SiteDocument'
import React from 'react'

export default function SiteLayout({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return <SiteDocument bodyClassName="body">{children}</SiteDocument>
}

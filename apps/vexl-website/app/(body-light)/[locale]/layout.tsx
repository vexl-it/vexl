import React from 'react'
import {SiteDocument} from '../../../src/components/SiteDocument'
import {generateLocaleParams, resolveLocale} from '../../../src/pageParams'

export const dynamicParams = false
export const generateStaticParams = generateLocaleParams

export default async function Layout({
  children,
  params,
}: {
  readonly children: React.ReactNode
  readonly params: Promise<{locale: string}>
}): Promise<React.JSX.Element> {
  return (
    <SiteDocument
      locale={await resolveLocale({params})}
      bodyClassName="body-light"
    >
      {children}
    </SiteDocument>
  )
}

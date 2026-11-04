import {colors} from '@vexl-next/ui/src/config/tokens'
import Script from 'next/script'
import React from 'react'
import {LocaleProvider} from '../../src/components/LocaleProvider'
import {SiteFooter} from '../../src/components/SiteFooter'
import {SiteHeader} from '../../src/components/SiteHeader'
import {TamaguiRoot} from '../../src/components/TamaguiRoot'
import {locales} from '../../src/i18n/locales'
import {resolveLocale} from '../../src/pageParams'
import '../globals.css'

export const dynamicParams = false

export function generateStaticParams(): Array<{locale: string}> {
  return locales.map((locale) => ({locale}))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  readonly children: React.ReactNode
  readonly params: Promise<{locale: string}>
}): Promise<React.JSX.Element> {
  const locale = await resolveLocale({params})

  return (
    <html lang={locale}>
      <body style={{margin: 0, backgroundColor: colors.black100}}>
        <TamaguiRoot>
          <LocaleProvider locale={locale}>
            <SiteHeader />
            <main style={{display: 'flex', flexDirection: 'column'}}>
              {children}
            </main>
            <SiteFooter />
          </LocaleProvider>
        </TamaguiRoot>
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="DSCYZACS"
          data-included-domains="vexl.it"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

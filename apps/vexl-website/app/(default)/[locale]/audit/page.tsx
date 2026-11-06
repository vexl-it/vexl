import {GlobalStyles} from '@/src/components/GlobalStyles'
import {pageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {resolveLocale, type LocaleParams} from '@/src/pageParams'
import {OldNav} from '@/src/views/oldNav/OldNav'
import {type Metadata} from 'next'
import React from 'react'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'audit')
  return pageMetadata({
    locale,
    path: '/audit',
    title: t.text('meta.title'),
    description: t.text('meta.description'),
  })
}

export default async function Audit(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'audit')
  return (
    <div className="page-wrapper download">
      <GlobalStyles />
      <div className="main-wrapper">
        <div className="section is-audit-hero">
          <div className="container is-hero-download">
            <div className="glassses is-hero-download" />
            <h1 className="h1 hero">{t('heading')}</h1>
            <div>
              <a
                href="/wf/631613baa8feb4226708b522_Vexl_mobile_app_pentest_report.pdf"
                className="secondary-button"
              >
                {t('download')}
              </a>
            </div>
          </div>
        </div>
      </div>
      <OldNav locale={locale} />
    </div>
  )
}

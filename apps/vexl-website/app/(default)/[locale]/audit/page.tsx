import {type Metadata} from 'next'
import React from 'react'
import {GlobalStyles} from '../../../../src/components/GlobalStyles'
import {audit} from '../../../../src/i18n/audit'
import {pageMetadata} from '../../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../../src/pageParams'
import {OldNav} from '../../../../src/views/oldNav/OldNav'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  return pageMetadata({
    locale,
    path: '/audit',
    title: audit[locale].metaTitle,
    description: audit[locale].metaDescription,
  })
}

export default async function Audit(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = audit[locale]
  return (
    <div className="page-wrapper download">
      <GlobalStyles />
      <div className="main-wrapper">
        <div className="section is-audit-hero">
          <div className="container is-hero-download">
            <div className="glassses is-hero-download" />
            <h1 className="h1 hero">{t.heading}</h1>
            <div>
              <a
                href="/wf/631613baa8feb4226708b522_Vexl_mobile_app_pentest_report.pdf"
                className="secondary-button"
              >
                {t.download}
              </a>
            </div>
          </div>
        </div>
      </div>
      <OldNav locale={locale} />
    </div>
  )
}

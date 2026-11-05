import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {GlobalStyles} from '../../../../src/components/GlobalStyles'
import {readContentFile} from '../../../../src/content/files'
import {termsPrivacy} from '../../../../src/i18n/termsPrivacy'
import {pageMetadata} from '../../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../../src/pageParams'
import {OldNav} from '../../../../src/views/oldNav/OldNav'

const legalHtml = (document: string): {__html: string} => ({
  __html: readContentFile('terms-privacy', `${document}.html`),
})

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  return pageMetadata({
    locale,
    path: '/terms-privacy',
    title: termsPrivacy[locale].metaTitle,
    description: termsPrivacy[locale].metaDescription,
  })
}

export default async function TermsPrivacy(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = termsPrivacy[locale]
  return (
    <div className="page-wrapper">
      <GlobalStyles />
      <OldNav locale={locale} />
      <div className="main-wrapper">
        <div className="section is-faqs-hero">
          <div className="container is-faqs-hero">
            <div className="glassses is-faqs-hero">
              <img
                src="/wf/62fb7130b9491eced45079f8_sunglasses.webp"
                loading="lazy"
                width={97.5}
                alt="Vexl glasses"
                className="glasses-image"
              />
            </div>
            <h1 className="h1 hero">
              {t.headingHref ? (
                <a href={t.headingHref}>{t.heading}</a>
              ) : (
                t.heading
              )}
            </h1>
          </div>
        </div>
        <div className="container is-terms">
          <div
            className="w-richtext"
            dangerouslySetInnerHTML={legalHtml('welcome')}
          />
        </div>
        <div className="section is-terms">
          <div className="container is-terms">
            <div className="w-dyn-list">
              <div role="list" className="w-dyn-items">
                {pipe(
                  t.documents,
                  Array.map((document) => (
                    <div key={document} role="listitem" className="w-dyn-item">
                      <div
                        id={document}
                        className="rich-text-block-2 w-richtext"
                        dangerouslySetInnerHTML={legalHtml(document)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

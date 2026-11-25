import {RollTextButton} from '@/src/components/RollTextButton'
import {SiteDocument} from '@/src/components/SiteDocument'
import {pageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {type Metadata} from 'next'
import React from 'react'

export function generateMetadata(): Metadata {
  const t = pageCopy('not-found')
  return pageMetadata({
    path: '/404',
    title: t.text('meta.title'),
  })
}

export default function NotFound(): React.JSX.Element {
  const t = pageCopy('not-found')
  return (
    <SiteDocument bodyClassName="body">
      <main className="not-found-wrap">
        <p className="not-found-code">{t('code')}</p>
        <h1 className="h2">{t('heading')}</h1>
        <p className="not-found-subtitle">{t('subtitle')}</p>
        <a href="/" className="link-block w-inline-block">
          <RollTextButton variant="blue">{t('backHome')}</RollTextButton>
        </a>
      </main>
    </SiteDocument>
  )
}

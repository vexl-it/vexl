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
    <SiteDocument>
      <div className="utility-page-wrap">
        <div className="utility-page-content">
          <img src="/wf/static/page-not-found.211a85e40c.svg" alt="" />
          <h2>{t('heading')}</h2>
          <div>{t('subtitle')}</div>
        </div>
      </div>
    </SiteDocument>
  )
}

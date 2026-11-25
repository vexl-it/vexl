import {AdvertisingSection} from '@/src/components/AdvertisingSection'
import {DevelopersFooter} from '@/src/components/DevelopersFooter'
import {GuideSection} from '@/src/components/GuideSection'
import {Navbar} from '@/src/components/Navbar'
import {ScrollEffects} from '@/src/components/ScrollEffects'
import {pageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {AppsGrid} from '@/src/views/apps/AppsGrid'
import {type Metadata} from 'next'
import React from 'react'

export function generateMetadata(): Metadata {
  const t = pageCopy('apps')
  return pageMetadata({
    path: '/apps',
    title: t.text('meta.title'),
    description: t.text('meta.description'),
  })
}

export default function AppsPage(): React.JSX.Element {
  const shared = pageCopy('shared')
  return (
    <div className="resource-group">
      <Navbar t={shared} variant="apps" />
      <AppsGrid shared={shared} />
      <GuideSection t={shared} />
      <AdvertisingSection t={shared} />
      <DevelopersFooter t={shared} />
      <ScrollEffects />
    </div>
  )
}

import {AdvertisingSection} from '@/src/components/AdvertisingSection'
import {DevelopersFooter} from '@/src/components/DevelopersFooter'
import {GuideSection} from '@/src/components/GuideSection'
import {Navbar} from '@/src/components/Navbar'
import {ScrollEffects} from '@/src/components/ScrollEffects'
import {pageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {AppsMarquee} from '@/src/views/home/AppsMarquee'
import {Hero} from '@/src/views/home/Hero'
import {Values} from '@/src/views/home/Values'
import {type Metadata} from 'next'
import React from 'react'

export function generateMetadata(): Metadata {
  const t = pageCopy('home')
  return pageMetadata({
    path: '/',
    title: t.text('meta.title'),
    description: t.text('meta.description'),
  })
}

export default function HomePage(): React.JSX.Element {
  const t = pageCopy('home')
  const shared = pageCopy('shared')
  return (
    <div className="resource-group">
      <Navbar t={shared} variant="home" />
      <Hero t={t} />
      <AppsMarquee t={t} shared={shared} />
      <GuideSection t={shared} />
      <AdvertisingSection t={shared} />
      <Values t={t} />
      <DevelopersFooter t={shared} />
      <ScrollEffects />
    </div>
  )
}

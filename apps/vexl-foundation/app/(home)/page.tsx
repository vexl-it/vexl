import {pageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {Board} from '@/src/views/home/Board'
import {Footer} from '@/src/views/home/Footer'
import {Intro} from '@/src/views/home/Intro'
import {Mission} from '@/src/views/home/Mission'
import {Navbar} from '@/src/views/home/Navbar'
import {Theses} from '@/src/views/home/Theses'
import {WhyFoundation} from '@/src/views/home/WhyFoundation'
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
  return (
    <>
      <Navbar t={t} />
      <Intro t={t} />
      <Mission t={t} />
      <Theses t={t} />
      <WhyFoundation t={t} />
      <Board t={t} />
      <Footer t={t} />
    </>
  )
}

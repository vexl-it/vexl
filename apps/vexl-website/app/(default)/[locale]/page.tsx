import {Footer} from '@/src/components/Footer'
import {GlobalStyles} from '@/src/components/GlobalStyles'
import {Navbar} from '@/src/components/Navbar'
import {pageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {type LocaleParams, resolveLocale} from '@/src/pageParams'
import {BottomHero} from '@/src/views/home/BottomHero'
import {Claim} from '@/src/views/home/Claim'
import {Features} from '@/src/views/home/Features'
import {Foundation} from '@/src/views/home/Foundation'
import {Hero} from '@/src/views/home/Hero'
import {HowItWorks} from '@/src/views/home/HowItWorks'
import {NoKyc} from '@/src/views/home/NoKyc'
import {OpenSource} from '@/src/views/home/OpenSource'
import {PhysicsSection} from '@/src/views/home/PhysicsSection'
import {type Metadata} from 'next'
import React from 'react'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'home')
  return pageMetadata({
    locale,
    path: '/',
    title: t.text('meta.title'),
    description: t.text('meta.description'),
  })
}

export default async function HomePage(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'home')
  return (
    <div className="page-wrapper">
      <GlobalStyles />
      <Navbar locale={locale} path="/" />
      <div className="main-wrapper">
        <div className="w-embed" />
        <Hero locale={locale} t={t} />
        <HowItWorks t={t} />
        <PhysicsSection />
        <Features t={t} />
        <NoKyc locale={locale} t={t} />
        <OpenSource t={t} />
        <Claim t={t} />
        <Foundation t={t} />
        <BottomHero locale={locale} t={t} />
        <Footer locale={locale} />
      </div>
    </div>
  )
}

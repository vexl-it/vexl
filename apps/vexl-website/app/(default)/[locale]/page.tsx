import {type Metadata} from 'next'
import React from 'react'
import {Footer} from '../../../src/components/Footer'
import {GlobalStyles} from '../../../src/components/GlobalStyles'
import {Navbar} from '../../../src/components/Navbar'
import {home} from '../../../src/i18n/home'
import {pageMetadata} from '../../../src/metadata'
import {type LocaleParams, resolveLocale} from '../../../src/pageParams'
import {BottomHero} from '../../../src/views/home/BottomHero'
import {Claim} from '../../../src/views/home/Claim'
import {Features} from '../../../src/views/home/Features'
import {Foundation} from '../../../src/views/home/Foundation'
import {Hero} from '../../../src/views/home/Hero'
import {HowItWorks} from '../../../src/views/home/HowItWorks'
import {NoKyc} from '../../../src/views/home/NoKyc'
import {OpenSource} from '../../../src/views/home/OpenSource'
import {PhysicsSection} from '../../../src/views/home/PhysicsSection'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = home[locale]
  return pageMetadata({
    locale,
    path: '/',
    title: t.title,
    description: t.description,
  })
}

export default async function HomePage(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = home[locale]
  return (
    <div className="page-wrapper">
      <GlobalStyles />
      <Navbar locale={locale} path="/" />
      <div className="main-wrapper">
        <div className="w-embed" />
        <Hero locale={locale} t={t.hero} />
        <HowItWorks t={t.howItWorks} />
        <PhysicsSection />
        <Features t={t.features} />
        <NoKyc locale={locale} t={t.noKyc} />
        <OpenSource t={t.openSource} />
        <Claim t={t.claim} />
        <Foundation t={t.foundation} />
        <BottomHero locale={locale} />
        <Footer locale={locale} />
      </div>
    </div>
  )
}

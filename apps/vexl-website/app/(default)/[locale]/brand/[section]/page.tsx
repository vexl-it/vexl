import {pageCopy} from '@/src/copy/pageCopy'
import {type Locale} from '@/src/i18n/locales'
import {resolveLocale} from '@/src/pageParams'
import {ApplicationExamples} from '@/src/views/brand/ApplicationExamples'
import {BrandingSamples} from '@/src/views/brand/BrandingSamples'
import {
  type BrandCopy,
  BrandPage,
  brandMetadata,
} from '@/src/views/brand/BrandPage'
import {Colors} from '@/src/views/brand/Colors'
import {Help} from '@/src/views/brand/Help'
import {Logos} from '@/src/views/brand/Logos'
import {People} from '@/src/views/brand/People'
import {PressKit} from '@/src/views/brand/PressKit'
import {
  type BrandSection,
  brandSections,
  isBrandSection,
} from '@/src/views/brand/sections'
import {Typography} from '@/src/views/brand/Typography'
import {VexlJourney} from '@/src/views/brand/VexlJourney'
import {Array} from 'effect'
import {type Metadata} from 'next'
import {notFound} from 'next/navigation'
import React from 'react'

interface Props {
  readonly params: Promise<{locale: string; section: string}>
}

export const dynamicParams = false

export function generateStaticParams(): Array<{section: string}> {
  return Array.map(brandSections, (section) => ({section}))
}

const sectionViews: Record<
  BrandSection,
  React.ComponentType<{readonly locale: Locale; readonly t: BrandCopy}>
> = {
  logos: Logos,
  colors: Colors,
  typography: Typography,
  'branding-samples': BrandingSamples,
  'application-examples': ApplicationExamples,
  people: People,
  'press-kit': PressKit,
  'vexl-journey': VexlJourney,
  help: Help,
}

async function resolveSection(
  props: Props
): Promise<{locale: Locale; section: BrandSection}> {
  const locale = await resolveLocale(props)
  const {section} = await props.params
  // dynamicParams already sends unknown sections to the 404 page
  if (!isBrandSection(section)) notFound()
  return {locale, section}
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {locale, section} = await resolveSection(props)
  return brandMetadata(locale, section)
}

export default async function BrandSectionPage(
  props: Props
): Promise<React.JSX.Element> {
  const {locale, section} = await resolveSection(props)
  const t = pageCopy(locale, 'brand')
  const View = sectionViews[section]
  return (
    <BrandPage
      locale={locale}
      section={section}
      title={t(`${section}.title`)}
      text={t(`${section}.summary`)}
    >
      <View locale={locale} t={t} />
    </BrandPage>
  )
}

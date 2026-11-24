import {pageCopy} from '@/src/copy/pageCopy'
import {type LocaleParams, resolveLocale} from '@/src/pageParams'
import {BrandHub} from '@/src/views/brand/BrandHub'
import {BrandPage, brandMetadata} from '@/src/views/brand/BrandPage'
import {type Metadata} from 'next'
import React from 'react'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return brandMetadata(await resolveLocale(props))
}

export default async function BrandManualPage(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'brand')
  return (
    <BrandPage locale={locale} title={t('hub.headline')} text={t('hub.text')}>
      <BrandHub locale={locale} t={t} />
    </BrandPage>
  )
}

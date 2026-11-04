import {type Metadata} from 'next'
import React from 'react'
import {Markdown} from '../../../src/components/Markdown'
import {getFaq} from '../../../src/content/faq'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {FaqView} from '../../../src/views/FaqView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'faq', '/faq')
}

export default async function FaqPage(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const categories = getFaq(await resolveLocale(props)).map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      question: item.question,
      answer: <Markdown>{item.answer}</Markdown>,
    })),
  }))
  return <FaqView categories={categories} />
}

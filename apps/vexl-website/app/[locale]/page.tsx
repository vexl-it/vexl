import {type Metadata} from 'next'
import React from 'react'
import {pageMetadata} from '../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../src/pageParams'
import {HomeView} from '../../src/views/HomeView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'home', '/')
}

export default function HomePage(): React.JSX.Element {
  return <HomeView />
}

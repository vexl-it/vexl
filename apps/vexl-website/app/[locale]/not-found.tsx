import {type Metadata} from 'next'
import React from 'react'
import {en} from '../../src/i18n/en'
import {NotFoundView} from '../../src/views/NotFoundView'

// Not-found pages get no route params, so the title is the English one
export const metadata: Metadata = {title: en.meta.notFound.title}

export default function NotFound(): React.JSX.Element {
  return <NotFoundView />
}

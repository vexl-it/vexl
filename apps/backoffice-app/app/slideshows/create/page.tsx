'use client'

import {SlideshowForm} from '@/src/components/slideshows/SlideshowForm'
import {Page, PageHeader} from '@/src/components/ui'
import {createSlideshow} from '@/src/services/slideshows/api'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

export default function CreateSlideshowPage() {
  const [slideshowUuid] = useState(() => crypto.randomUUID())
  const router = useRouter()

  return (
    <Page>
      <PageHeader
        title="Create slideshow"
        description="Add the slides, then save to get the link for the TV."
        back={{href: '/slideshows', label: 'TV slideshows'}}
      />
      <SlideshowForm
        slideshowUuid={slideshowUuid}
        submitLabel="Create slideshow"
        onSubmit={async (data) => {
          const {slideshow} = await createSlideshow({
            uuid: slideshowUuid,
            ...data,
          })
          router.push(`/slideshows/${slideshow.uuid}/edit`)
        }}
      />
    </Page>
  )
}

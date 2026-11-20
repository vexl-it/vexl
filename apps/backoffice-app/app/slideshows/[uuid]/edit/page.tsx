'use client'

import {SlideshowForm} from '@/src/components/slideshows/SlideshowForm'
import {TvLinkCard} from '@/src/components/slideshows/TvLinkCard'
import {
  Alert,
  Button,
  Page,
  PageHeader,
  StatusMessage,
} from '@/src/components/ui'
import {formatDateTime} from '@/src/services/format'
import {getSlideshow, updateSlideshow} from '@/src/services/slideshows/api'
import {type TvSlideshow} from '@/src/services/slideshows/domain'
import {useParams} from 'next/navigation'
import {useCallback, useEffect, useState} from 'react'

const BACK = {href: '/slideshows', label: 'TV slideshows'}

export default function EditSlideshowPage() {
  const {uuid} = useParams<{uuid: string}>()
  const [slideshow, setSlideshow] = useState<TvSlideshow | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(() => {
    getSlideshow(uuid).then(
      (result) => {
        setLoadError(null)
        setSlideshow(result.slideshow)
      },
      (error: unknown) => {
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load slideshow'
        )
      }
    )
  }, [uuid])

  useEffect(load, [load])

  if (loadError)
    return (
      <Page>
        <PageHeader title="Edit slideshow" back={BACK} />
        <Alert tone="error" action={<Button onClick={load}>Try again</Button>}>
          {loadError}
        </Alert>
      </Page>
    )

  if (!slideshow)
    return <StatusMessage loading>Loading slideshow…</StatusMessage>

  return (
    <Page>
      <PageHeader
        title={slideshow.name}
        description={`Last saved ${formatDateTime(slideshow.updatedAt)}`}
        back={BACK}
      />
      <SlideshowForm
        key={slideshow.uuid}
        slideshowUuid={slideshow.uuid}
        initial={slideshow}
        submitLabel="Save changes"
        savedMessage="Saved. TVs pick the changes up when their current loop ends."
        aside={
          <TvLinkCard slideshow={slideshow} onRegenerated={setSlideshow} />
        }
        onSubmit={async (data) => {
          setSlideshow((await updateSlideshow(uuid, data)).slideshow)
        }}
      />
    </Page>
  )
}

'use client'

import {Button, Modal} from '@/src/components/ui'
import {
  type SlideshowSlide,
  type SlideshowSlides,
} from '@/src/services/slideshows/domain'
import {formatDuration} from '@/src/services/slideshows/format'
import {useCallback, useEffect, useState} from 'react'
import {SLIDE_TYPES, SlideThumbnail} from './SlideThumbnail'

function PlayingSlide({slide}: {readonly slide: SlideshowSlide}) {
  if (slide.type === 'video' && slide.url)
    return (
      <video
        src={slide.url}
        autoPlay
        muted
        loop
        playsInline
        className="aspect-video w-full rounded-control bg-ink object-contain"
      />
    )

  if (slide.type === 'website')
    return (
      <iframe
        src={slide.url}
        title="Website slide"
        sandbox="allow-scripts allow-same-origin"
        className="aspect-video w-full rounded-control border-0 bg-ink"
      />
    )

  return <SlideThumbnail slide={slide} />
}

/** Plays the slides in a dialog with the timing the TV uses. */
export function SlideshowPreview({
  slides,
  startIndex = 0,
  description,
  onClose,
}: {
  readonly slides: SlideshowSlides
  readonly startIndex?: number
  readonly description?: string
  readonly onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const slide = slides[index] ?? slides[0]
  const step = useCallback(
    (offset: number) => {
      setIndex((current) => (current + offset + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (!slide || !(slide.durationSeconds > 0)) return
    const timeout = setTimeout(step, slide.durationSeconds * 1000, 1)
    return () => {
      clearTimeout(timeout)
    }
  }, [slide, step])

  if (!slide) return null

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="Preview"
      description={description}
      footer={
        <>
          <span className="mr-auto self-center text-sm text-ink-muted">
            Slide {index + 1} of {slides.length} ·{' '}
            {SLIDE_TYPES[slide.type].label} ·{' '}
            {formatDuration(slide.durationSeconds)}
          </span>
          <Button
            onClick={() => {
              step(-1)
            }}
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              step(1)
            }}
          >
            Next
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <PlayingSlide key={slide.uuid} slide={slide} />
    </Modal>
  )
}

'use client'

import {
  Alert,
  Button,
  Card,
  cx,
  GlobeIcon,
  PlayIcon,
  UploadIcon,
} from '@/src/components/ui'
import {
  formatDuration,
  loopSeconds,
  pluralize,
} from '@/src/services/slideshows/format'
import {Array} from 'effect'
import {type DragEvent, useState} from 'react'
import {FileButton} from './FileButton'
import {SlideRow} from './SlideRow'
import {SlideshowPreview} from './SlideshowPreview'
import {SLIDE_TYPES} from './SlideThumbnail'
import {slideError, type Slides} from './useSlides'

const MEDIA_ACCEPT = `${SLIDE_TYPES.image.accept},${SLIDE_TYPES.video.accept}`

const carriesFiles = (event: DragEvent): boolean =>
  Array.contains(event.dataTransfer.types, 'Files')

export function SlideList({
  slides,
  showErrors,
}: {
  readonly slides: Slides
  readonly showErrors: boolean
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [fileOver, setFileOver] = useState(false)
  const count = slides.slides.length

  // Swapping only past the middle of a row keeps rows of different heights
  // from flipping back and forth under the pointer.
  const reorderOnDragOver =
    (index: number) => (event: DragEvent<HTMLLIElement>) => {
      if (draggedIndex === null) return
      event.preventDefault()
      if (draggedIndex === index) return

      const {top, height} = event.currentTarget.getBoundingClientRect()
      const pastMiddle = event.clientY > top + height / 2
      if (draggedIndex < index === pastMiddle) {
        slides.move(draggedIndex, index)
        setDraggedIndex(index)
      }
    }

  return (
    <div
      className={cx('rounded-card', fileOver && 'ring-2 ring-focus')}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        setFileOver(true)
      }}
      onDragLeave={({currentTarget, relatedTarget}) => {
        if (
          !(
            relatedTarget instanceof Node &&
            currentTarget.contains(relatedTarget)
          )
        )
          setFileOver(false)
      }}
      onDrop={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        setFileOver(false)
        slides.addFiles(Array.fromIterable(event.dataTransfer.files))
      }}
    >
      <Card
        flush
        title="Slides"
        description={
          count === 0
            ? 'The TV shows them in this order, in a loop.'
            : `${pluralize(count, 'slide')} · one loop takes ${formatDuration(loopSeconds(slides.slides))}`
        }
        actions={
          <Button
            icon={<PlayIcon />}
            disabled={count === 0}
            onClick={() => {
              setPreviewIndex(0)
            }}
          >
            Preview
          </Button>
        }
      >
        {count > 0 ? (
          <ol className="divide-y divide-line border-b border-line">
            {Array.map(slides.slides, (slide, index) => (
              <SlideRow
                key={slide.uuid}
                slide={slide}
                index={index}
                count={count}
                upload={slides.uploadOf(slide.uuid)}
                error={showErrors ? slideError(slide) : null}
                dragging={draggedIndex === index}
                onChange={(change) => {
                  slides.update(slide.uuid, change)
                }}
                onReplaceFile={(file) => {
                  slides.replaceFile(slide, file)
                }}
                onMove={(toIndex) => {
                  slides.move(index, toIndex)
                }}
                onRemove={() => {
                  slides.remove(slide.uuid)
                }}
                onPreview={() => {
                  setPreviewIndex(index)
                }}
                onDragStart={() => {
                  setDraggedIndex(index)
                }}
                onDragEnd={() => {
                  setDraggedIndex(null)
                }}
                onDragOver={reorderOnDragOver(index)}
              />
            ))}
          </ol>
        ) : null}

        <div className="space-y-3 p-4 sm:p-5">
          {Array.isNonEmptyReadonlyArray(slides.rejectedFiles) ? (
            <Alert tone="error" title="Some files were skipped">
              {Array.join(slides.rejectedFiles, ', ')}: only PNG, JPG, WEBP, MP4
              and WEBM files can be slides.
            </Alert>
          ) : null}
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong px-4 py-6 text-center">
            <p className="text-sm text-ink-muted">
              {count === 0 ? 'No slides yet. ' : null}
              Drop images and videos here, or pick them. Each file becomes a
              slide.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <FileButton
                multiple
                accept={MEDIA_ACCEPT}
                icon={<UploadIcon />}
                onFiles={slides.addFiles}
              >
                Add images or videos
              </FileButton>
              <Button icon={<GlobeIcon />} onClick={slides.addWebsite}>
                Add website
              </Button>
            </div>
            <p className="text-xs text-ink-subtle">
              PNG, JPG, WEBP, MP4 or WEBM
            </p>
          </div>
        </div>
      </Card>

      {previewIndex === null ? null : (
        <SlideshowPreview
          slides={slides.slides}
          startIndex={previewIndex}
          description="Plays with the timing the TV uses, unsaved changes included."
          onClose={() => {
            setPreviewIndex(null)
          }}
        />
      )}
    </div>
  )
}

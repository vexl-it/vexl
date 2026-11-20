'use client'

import {
  Button,
  ChevronDownIcon,
  ChevronUpIcon,
  cx,
  GripVerticalIcon,
  Input,
  SegmentedControl,
  type SegmentedOption,
  TrashIcon,
  UploadIcon,
} from '@/src/components/ui'
import {type SlideshowSlide} from '@/src/services/slideshows/domain'
import {formatDuration} from '@/src/services/slideshows/format'
import {type DragEvent, type ReactNode, useState} from 'react'
import {FileButton} from './FileButton'
import {SLIDE_TYPES, SlideThumbnail} from './SlideThumbnail'
import {isUploading, type SlideError, type UploadState} from './useSlides'

// Full width on phones, beside the thumbnail from `sm` up.
const BELOW_HEADER = 'col-span-3 sm:col-span-1 sm:col-start-3'

const FIT_OPTIONS: ReadonlyArray<SegmentedOption<'cover' | 'contain'>> = [
  {
    value: 'cover',
    label: <span title="Fill the screen and crop the edges">Cover</span>,
  },
  {
    value: 'contain',
    label: <span title="Show the whole image, with bars">Contain</span>,
  },
]

function UploadProgress({progress}: {readonly progress: number}) {
  const percent = Math.round(progress * 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-label="Upload progress"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/80 px-4 text-xs font-medium text-white"
    >
      Uploading {percent}%
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
        <div className="h-full bg-accent" style={{width: `${percent}%`}} />
      </div>
    </div>
  )
}

function Control({
  label,
  className,
  children,
}: {
  readonly label: string
  readonly className?: string
  readonly children: ReactNode
}) {
  return (
    <label
      className={cx(
        'flex items-center gap-2 text-sm text-ink-muted',
        className
      )}
    >
      <span className="shrink-0">{label}</span>
      {children}
    </label>
  )
}

export function SlideRow({
  slide,
  index,
  count,
  upload,
  error,
  dragging,
  onChange,
  onReplaceFile,
  onMove,
  onRemove,
  onPreview,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  readonly slide: SlideshowSlide
  readonly index: number
  readonly count: number
  readonly upload: UploadState | undefined
  readonly error: SlideError | null
  readonly dragging: boolean
  readonly onChange: (change: (slide: SlideshowSlide) => SlideshowSlide) => void
  readonly onReplaceFile: (file: File) => void
  readonly onMove: (toIndex: number) => void
  readonly onRemove: () => void
  readonly onPreview: () => void
  readonly onDragStart: () => void
  readonly onDragEnd: () => void
  readonly onDragOver: (event: DragEvent<HTMLLIElement>) => void
}) {
  const [videoSeconds, setVideoSeconds] = useState<number | null>(null)
  const {label, Icon, accept} = SLIDE_TYPES[slide.type]
  const uploading = isUploading(upload)
  const message = uploading ? null : (upload?.error ?? error?.message)

  return (
    <li
      onDragOver={onDragOver}
      className={cx(
        'grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-4 sm:px-5',
        dragging && 'opacity-40'
      )}
    >
      <div className="flex w-6 flex-col items-center gap-1 text-ink-subtle sm:row-span-3">
        <span className="flex h-8 items-center text-sm font-semibold tabular-nums text-ink">
          {index + 1}
        </span>
        <span
          draggable
          title="Drag to reorder"
          onDragStart={(event) => {
            const row = event.currentTarget.closest('li')
            if (row) event.dataTransfer.setDragImage(row, 16, 16)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', slide.uuid)
            onDragStart()
          }}
          onDragEnd={onDragEnd}
          className="hidden cursor-grab rounded-control p-1 hover:bg-ink/5 hover:text-ink active:cursor-grabbing sm:block"
        >
          <GripVerticalIcon strokeWidth={2.5} />
        </span>
      </div>

      <button
        type="button"
        title="Preview from this slide"
        onClick={onPreview}
        className="w-28 cursor-pointer rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:row-span-3 min-[1400px]:w-36"
      >
        <SlideThumbnail slide={slide} onVideoSeconds={setVideoSeconds}>
          {uploading ? <UploadProgress progress={upload.progress} /> : null}
        </SlideThumbnail>
      </button>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <Icon className="text-ink-subtle" />
          {label}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Move up"
            title="Move up"
            disabled={index === 0}
            icon={<ChevronUpIcon />}
            onClick={() => {
              onMove(index - 1)
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            aria-label="Move down"
            title="Move down"
            disabled={index === count - 1}
            icon={<ChevronDownIcon />}
            onClick={() => {
              onMove(index + 1)
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            aria-label="Remove slide"
            title="Remove slide"
            icon={<TrashIcon />}
            onClick={onRemove}
          />
        </div>
      </div>

      <div
        className={cx(
          BELOW_HEADER,
          'flex flex-wrap items-center gap-x-3 gap-y-2'
        )}
      >
        {slide.type === 'website' ? (
          <Control label="Address" className="min-w-56 flex-1">
            <Input
              type="url"
              placeholder="https://"
              value={slide.url}
              invalid={error?.field === 'url'}
              onChange={(event) => {
                const url = event.target.value
                onChange((current) =>
                  current.type === 'website' ? {...current, url} : current
                )
              }}
            />
          </Control>
        ) : null}

        <Control label="Show for">
          <span className="w-16">
            <Input
              type="number"
              min={1}
              max={86400}
              aria-label="Duration in seconds"
              value={
                Number.isNaN(slide.durationSeconds) ? '' : slide.durationSeconds
              }
              invalid={error?.field === 'duration'}
              onChange={(event) => {
                const durationSeconds = event.target.valueAsNumber
                onChange((current) => ({...current, durationSeconds}))
              }}
            />
          </span>
          {slide.durationSeconds >= 60
            ? `s = ${formatDuration(slide.durationSeconds)}`
            : 's'}
        </Control>

        {slide.type === 'image' ? (
          <SegmentedControl
            label="How the image fills the screen"
            value={slide.fit}
            options={FIT_OPTIONS}
            onChange={(fit) => {
              onChange((current) =>
                current.type === 'image' ? {...current, fit} : current
              )
            }}
          />
        ) : null}

        {slide.type === 'website' || uploading ? null : (
          <FileButton
            size="sm"
            accept={accept}
            icon={<UploadIcon />}
            onFiles={([file]) => {
              if (file) onReplaceFile(file)
            }}
          >
            {slide.url ? 'Replace' : 'Choose file'}
          </FileButton>
        )}
        {videoSeconds && videoSeconds !== slide.durationSeconds ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange((current) => ({
                ...current,
                durationSeconds: videoSeconds,
              }))
            }}
          >
            Use video length ({formatDuration(videoSeconds)})
          </Button>
        ) : null}
      </div>

      {message ? (
        <p role="alert" className={cx(BELOW_HEADER, 'text-xs text-danger-ink')}>
          {message}
        </p>
      ) : null}
    </li>
  )
}

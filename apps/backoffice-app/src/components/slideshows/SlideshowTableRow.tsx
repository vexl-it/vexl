'use client'

import {
  Badge,
  Button,
  ButtonLink,
  CopyButton,
  DuplicateIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlayIcon,
  RefreshIcon,
  Td,
  TdActions,
  Tr,
  TrashIcon,
} from '@/src/components/ui'
import {formatDate, formatDateTime} from '@/src/services/format'
import {usePublicHosts} from '@/src/services/publicHosts'
import {
  getPublicIdentifier,
  type SlideshowSlides,
  type TvSlideshow,
} from '@/src/services/slideshows/domain'
import {
  formatDuration,
  loopSeconds,
  pluralize,
} from '@/src/services/slideshows/format'
import {Array, pipe, Record} from 'effect'
import Link from 'next/link'
import {type ReactNode} from 'react'
import {SlideThumbnail} from './SlideThumbnail'
import {tvUrl} from './tvLink'

export type RowActionKey = 'duplicate' | 'regenerate' | 'delete'

const describeSlides = (slides: SlideshowSlides): string =>
  pipe(
    slides,
    Array.groupBy(({type}) => type),
    Record.toEntries,
    Array.map(([type, ofType]) => pluralize(ofType.length, type)),
    Array.join(' · ')
  )

function RowAction({
  label,
  ...props
}: {
  readonly label: string
  readonly icon: ReactNode
  readonly loading: boolean
  readonly onClick: () => void
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      title={label}
      aria-label={label}
      {...props}
    />
  )
}

// The table has to fit next to the sidebar on a 1280px laptop, so below
// 1400px it drops labels and narrows the thumbnail and the link.
export function SlideshowTableRow({
  slideshow,
  busyAction,
  onPreview,
  onDuplicate,
  onRegenerate,
  onDelete,
}: {
  readonly slideshow: TvSlideshow
  readonly busyAction: RowActionKey | null
  readonly onPreview: () => void
  readonly onDuplicate: () => void
  readonly onRegenerate: () => void
  readonly onDelete: () => void
}) {
  const hosts = usePublicHosts()
  const url = tvUrl(hosts, slideshow)
  const editHref = `/slideshows/${slideshow.uuid}/edit`
  const hasSlides = Array.isNonEmptyReadonlyArray(slideshow.slides)

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Preview"
            aria-label={`Preview ${slideshow.name}`}
            disabled={!hasSlides}
            onClick={onPreview}
            className="group relative w-16 shrink-0 cursor-pointer rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-default min-[1400px]:w-20"
          >
            <SlideThumbnail slide={slideshow.slides[0]}>
              {hasSlides ? (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayIcon className="size-5" />
                </span>
              ) : null}
            </SlideThumbnail>
          </button>
          <div className="min-w-32">
            <Link
              href={editHref}
              title={slideshow.name}
              className="line-clamp-2 max-w-sm font-medium hover:underline"
            >
              {slideshow.name}
            </Link>
            <p className="text-xs text-ink-muted">
              {hasSlides ? describeSlides(slideshow.slides) : 'No slides yet'}
            </p>
          </div>
        </div>
      </Td>
      <Td>
        {!slideshow.isEnabled ? (
          <Badge>Disabled</Badge>
        ) : hasSlides ? (
          <Badge tone="success">Enabled</Badge>
        ) : (
          <Badge tone="warning">Empty</Badge>
        )}
      </Td>
      <Td align="right" className="whitespace-nowrap tabular-nums">
        {slideshow.slides.length}
        {hasSlides ? (
          <p className="text-xs text-ink-muted">
            {formatDuration(loopSeconds(slideshow.slides))}
            <span className="max-[1399px]:hidden"> loop</span>
          </p>
        ) : null}
      </Td>
      <Td>
        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title={url}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-ink hover:underline"
          >
            <span className="max-w-24 truncate min-[1400px]:max-w-36">
              /{getPublicIdentifier(slideshow)}
            </span>
            <ExternalLinkIcon className="size-3.5 shrink-0" />
          </a>
          <CopyButton value={url} variant="ghost" />
        </div>
      </Td>
      <Td
        title={formatDateTime(slideshow.updatedAt)}
        className="whitespace-nowrap text-ink-muted"
      >
        {formatDate(slideshow.updatedAt)}
      </Td>
      <TdActions>
        <ButtonLink
          href={editHref}
          size="sm"
          variant="ghost"
          title="Edit"
          aria-label="Edit"
          icon={<PencilIcon />}
        >
          <span className="max-[1399px]:hidden">Edit</span>
        </ButtonLink>
        <RowAction
          label="Duplicate"
          icon={<DuplicateIcon />}
          loading={busyAction === 'duplicate'}
          onClick={onDuplicate}
        />
        <RowAction
          label="Regenerate link"
          icon={<RefreshIcon />}
          loading={busyAction === 'regenerate'}
          onClick={onRegenerate}
        />
        <RowAction
          label="Delete"
          icon={<TrashIcon />}
          loading={busyAction === 'delete'}
          onClick={onDelete}
        />
      </TdActions>
    </Tr>
  )
}

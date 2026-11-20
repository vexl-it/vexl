'use client'

import {SlideshowPreview} from '@/src/components/slideshows/SlideshowPreview'
import {
  type RowActionKey,
  SlideshowTableRow,
} from '@/src/components/slideshows/SlideshowTableRow'
import {regenerateLinkConfirmation} from '@/src/components/slideshows/tvLink'
import {
  Alert,
  type AlertTone,
  Button,
  ButtonLink,
  Card,
  CopyButton,
  EmptyState,
  Input,
  Page,
  PageHeader,
  PlusIcon,
  SearchIcon,
  SegmentedControl,
  type SegmentedOption,
  type SortState,
  SortTh,
  Table,
  Th,
  TvIcon,
  useConfirm,
} from '@/src/components/ui'
import {publicUrl, usePublicHosts} from '@/src/services/publicHosts'
import {
  deleteSlideshow,
  duplicateSlideshow,
  listSlideshows,
  regenerateSlideshowToken,
} from '@/src/services/slideshows/api'
import {type TvSlideshow} from '@/src/services/slideshows/domain'
import {pluralize} from '@/src/services/slideshows/format'
import {Array, Order, pipe, type Record} from 'effect'
import {useRouter} from 'next/navigation'
import {type ReactNode, useCallback, useEffect, useState} from 'react'

type SortKey = 'name' | 'slides' | 'updatedAt'
type StatusFilter = 'all' | 'enabled' | 'disabled'

const ORDERS: Record.ReadonlyRecord<SortKey, Order.Order<TvSlideshow>> = {
  name: Order.mapInput(Order.string, ({name}) => name.toLowerCase()),
  slides: Order.mapInput(Order.number, ({slides}) => slides.length),
  updatedAt: Order.mapInput(Order.string, ({updatedAt}) => updatedAt),
}

const FAILURES: Record.ReadonlyRecord<RowActionKey, string> = {
  duplicate: 'Could not duplicate',
  regenerate: 'Could not regenerate the link for',
  delete: 'Could not delete',
}

const STATUS_OPTIONS: ReadonlyArray<SegmentedOption<StatusFilter>> = [
  {value: 'all', label: 'All'},
  {value: 'enabled', label: 'Enabled'},
  {value: 'disabled', label: 'Disabled'},
]

interface Notice {
  readonly tone: AlertTone
  readonly text: string
  readonly action?: ReactNode
}

export default function SlideshowsPage() {
  const hosts = usePublicHosts()
  const router = useRouter()
  const {confirm, dialog} = useConfirm()
  const [slideshows, setSlideshows] = useState<readonly TvSlideshow[] | null>(
    null
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [busy, setBusy] = useState<{
    readonly uuid: string
    readonly action: RowActionKey
  } | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: 'updatedAt',
    descending: true,
  })
  const [previewed, setPreviewed] = useState<TvSlideshow | null>(null)

  const load = useCallback(() => {
    listSlideshows().then(
      (result) => {
        setLoadError(null)
        setSlideshows(result.slideshows)
      },
      (error: unknown) => {
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load slideshows'
        )
      }
    )
  }, [])

  useEffect(load, [load])

  const run = async (
    {uuid, name}: TvSlideshow,
    action: RowActionKey,
    task: () => Promise<Notice | null>
  ) => {
    setBusy({uuid, action})
    try {
      setNotice(await task())
    } catch (error) {
      setNotice({
        tone: 'error',
        text: `${FAILURES[action]} “${name}”: ${error instanceof Error ? error.message : 'unknown error'}`,
      })
    } finally {
      setBusy(null)
    }
  }

  const duplicate = (slideshow: TvSlideshow) =>
    run(slideshow, 'duplicate', async () => {
      const result = await duplicateSlideshow(slideshow.uuid)
      router.push(`/slideshows/${result.slideshow.uuid}/edit`)
      return null
    })

  const regenerate = async (slideshow: TvSlideshow) => {
    if (!(await confirm(regenerateLinkConfirmation(hosts, slideshow)))) return

    await run(slideshow, 'regenerate', async () => {
      const {slideshow: updated} = await regenerateSlideshowToken(
        slideshow.uuid
      )
      setSlideshows(
        (current) =>
          current &&
          Array.map(current, (existing) =>
            existing.uuid === updated.uuid ? updated : existing
          )
      )
      return {
        tone: 'success',
        text: `New link for “${updated.name}”. Open it on every TV that used the old one.`,
        action: (
          <CopyButton
            value={publicUrl(hosts.slideshows, updated.publicToken)}
            label="Copy new link"
          />
        ),
      }
    })
  }

  const remove = async (slideshow: TvSlideshow) => {
    const confirmed = await confirm({
      title: `Delete “${slideshow.name}”?`,
      message: `This permanently removes the slideshow and its ${pluralize(slideshow.slides.length, 'slide')}. TVs showing it stop playing. It cannot be undone.`,
      confirmLabel: 'Delete slideshow',
    })
    if (!confirmed) return

    await run(slideshow, 'delete', async () => {
      await deleteSlideshow(slideshow.uuid)
      setSlideshows(
        (current) =>
          current && Array.filter(current, ({uuid}) => uuid !== slideshow.uuid)
      )
      return {tone: 'success', text: `Deleted “${slideshow.name}”.`}
    })
  }

  const needle = query.trim().toLowerCase()
  const visible = pipe(
    slideshows ?? [],
    Array.filter(
      (slideshow) =>
        (status === 'all' || slideshow.isEnabled === (status === 'enabled')) &&
        `${slideshow.name} ${slideshow.publicSlug ?? ''}`
          .toLowerCase()
          .includes(needle)
    ),
    Array.sort(
      sort.descending ? Order.reverse(ORDERS[sort.key]) : ORDERS[sort.key]
    )
  )
  const createButton = (
    <ButtonLink href="/slideshows/create" variant="primary" icon={<PlusIcon />}>
      Create slideshow
    </ButtonLink>
  )

  return (
    <Page>
      <PageHeader
        title="TV slideshows"
        description="Loops of images, videos and websites that TVs play through a public link."
        actions={createButton}
      />

      {loadError ? (
        <Alert tone="error" action={<Button onClick={load}>Try again</Button>}>
          {loadError}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone={notice.tone} action={notice.action}>
          {notice.text}
        </Alert>
      ) : null}

      {slideshows && Array.isNonEmptyReadonlyArray(slideshows) ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle" />
            <Input
              type="search"
              aria-label="Search slideshows"
              placeholder="Search by name or slug"
              className="pl-9"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
            />
          </div>
          <SegmentedControl
            label="Filter by status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
        </div>
      ) : null}

      {slideshows === null && loadError ? null : (
        <Card flush>
          <Table
            loading={slideshows === null}
            head={
              <>
                <SortTh sortKey="name" sort={sort} onSort={setSort}>
                  Slideshow
                </SortTh>
                <Th>Status</Th>
                <SortTh
                  sortKey="slides"
                  sort={sort}
                  onSort={setSort}
                  align="right"
                >
                  Slides
                </SortTh>
                <Th>TV link</Th>
                <SortTh sortKey="updatedAt" sort={sort} onSort={setSort}>
                  Updated
                </SortTh>
                <Th />
              </>
            }
            empty={
              slideshows && Array.isNonEmptyReadonlyArray(slideshows) ? (
                <EmptyState
                  title="No slideshows match"
                  action={
                    <Button
                      onClick={() => {
                        setQuery('')
                        setStatus('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<TvIcon className="size-5" />}
                  title="No slideshows yet"
                  description="Create one, add slides and open its link on a TV."
                  action={createButton}
                />
              )
            }
          >
            {Array.map(visible, (slideshow) => (
              <SlideshowTableRow
                key={slideshow.uuid}
                slideshow={slideshow}
                busyAction={busy?.uuid === slideshow.uuid ? busy.action : null}
                onPreview={() => {
                  setPreviewed(slideshow)
                }}
                onDuplicate={() => {
                  void duplicate(slideshow)
                }}
                onRegenerate={() => {
                  void regenerate(slideshow)
                }}
                onDelete={() => {
                  void remove(slideshow)
                }}
              />
            ))}
          </Table>
        </Card>
      )}

      {previewed ? (
        <SlideshowPreview
          slides={previewed.slides}
          description={previewed.name}
          onClose={() => {
            setPreviewed(null)
          }}
        />
      ) : null}
      {dialog}
    </Page>
  )
}

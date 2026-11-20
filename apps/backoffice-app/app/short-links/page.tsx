'use client'

import {ShortLinkSparkline} from '@/src/components/ShortLinkClicksChart'
import {
  Alert,
  Button,
  Card,
  CopyButton,
  cx,
  EmptyState,
  LinkIcon,
  Page,
  PageHeader,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SearchInput,
  Select,
  StatCard,
  Table,
  Td,
  Th,
  Tr,
  TrashIcon,
  useConfirm,
} from '@/src/components/ui'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {formatDate, formatNumber} from '@/src/services/format'
import {publicUrl, usePublicHosts} from '@/src/services/publicHosts'
import {deleteShortLink, listShortLinks} from '@/src/services/shortLinks/api'
import {type ShortLink} from '@/src/services/shortLinks/domain'
import {Array, Option, Order, pipe, Schema} from 'effect'
import {useCallback, useEffect, useState} from 'react'
import {CreateShortLinkModal} from './CreateShortLinkModal'
import {clicksInRange} from './format'
import {ShortLinkDetailsModal} from './ShortLinkDetailsModal'

const errorMessage = makeApiErrorMessage({})

const SortKey = Schema.Literal('newest', 'oldest', 'clicks', 'recentClicks')
type SortKey = typeof SortKey.Type
const isSortKey = Schema.is(SortKey)

const byCreated = Order.mapInput(
  Order.string,
  (link: ShortLink) => link.createdAt
)
const byMost = (clicks: (link: ShortLink) => number): Order.Order<ShortLink> =>
  Order.reverse(Order.mapInput(Order.number, clicks))

const SORTS: Record<
  SortKey,
  {readonly label: string; readonly order: Order.Order<ShortLink>}
> = {
  newest: {label: 'Newest first', order: Order.reverse(byCreated)},
  oldest: {label: 'Oldest first', order: byCreated},
  clicks: {label: 'Most clicks', order: byMost((link) => link.totalClicks)},
  recentClicks: {
    label: 'Most clicks, last 7 days',
    order: byMost((link) => link.clicksLast7Days),
  },
}

// Narrow screens keep the slug, its copy button and the total; the rest is in the details.
const COLUMNS = {
  target: 'hidden xl:table-cell',
  recentClicks: 'hidden sm:table-cell',
  trend: 'hidden xl:table-cell',
  created: 'hidden min-[1400px]:table-cell',
  actions: 'hidden md:table-cell',
}

const sumOf = (
  links: readonly ShortLink[],
  clicks: (link: ShortLink) => number
): string =>
  pipe(
    links,
    Array.reduce(0, (sum, link) => sum + clicks(link)),
    formatNumber
  )

interface Notice {
  readonly tone: 'success' | 'error'
  readonly text: string
}

export default function ShortLinksPage() {
  const hosts = usePublicHosts()
  const {confirm, dialog} = useConfirm()
  const [links, setLinks] = useState<readonly ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [creating, setCreating] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const loadLinks = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setLinks((await listShortLinks()).links)
    } catch (error) {
      setLoadError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  const query = search.trim().toLowerCase()
  const visibleLinks = pipe(
    links,
    Array.filter(
      (link) =>
        link.slug.includes(query) ||
        link.targetUrl.toLowerCase().includes(query)
    ),
    Array.sort(SORTS[sort].order)
  )
  const selected = pipe(
    links,
    Array.findFirst((link) => link.slug === selectedSlug),
    Option.getOrNull
  )

  const handleDelete = async (link: ShortLink) => {
    const shortUrl = `${hosts.shortLinks}/${link.slug}`
    const confirmed = await confirm({
      title: `Delete ${shortUrl}?`,
      message:
        'The link stops working everywhere it was shared: posts, messages, printed materials. Its click history is deleted too. This cannot be undone.',
      confirmLabel: 'Delete link',
    })
    if (!confirmed) return

    try {
      await deleteShortLink(link.slug)
      setLinks(Array.filter((current) => current.slug !== link.slug))
      setNotice({tone: 'success', text: `${shortUrl} was deleted.`})
    } catch (error) {
      setNotice({tone: 'error', text: errorMessage(error)})
    }
    setSelectedSlug(null)
  }

  const openCreate = () => {
    setNotice(null)
    setCreating(true)
  }
  const stat = (clicks: (link: ShortLink) => number): string =>
    loading ? '–' : sumOf(links, clicks)

  return (
    <Page>
      <PageHeader
        title="Short links"
        description={`Links served from ${hosts.shortLinks}. Only daily click counts are recorded: no IP addresses, referrers or devices.`}
        actions={
          <Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>
            New short link
          </Button>
        }
      />

      {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
      {loadError ? (
        <Alert
          tone="error"
          title="Short links could not be loaded"
          action={
            <Button
              size="sm"
              onClick={() => {
                void loadLinks()
              }}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Links"
              value={loading ? '–' : formatNumber(links.length)}
            />
            <StatCard
              label="Clicks, all time"
              value={stat((link) => link.totalClicks)}
            />
            <StatCard
              label="Clicks, last 30 days"
              value={stat(clicksInRange)}
            />
            <StatCard
              label="Clicks, last 7 days"
              value={stat((link) => link.clicksLast7Days)}
            />
          </div>

          <Card flush>
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
              <SearchInput
                className="w-full sm:w-72"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                }}
                placeholder="Search by slug or target"
                aria-label="Search short links"
              />
              <div className="w-full sm:w-56">
                <Select
                  value={sort}
                  onChange={(event) => {
                    if (isSortKey(event.target.value))
                      setSort(event.target.value)
                  }}
                  aria-label="Sort short links"
                >
                  {pipe(
                    SortKey.literals,
                    Array.map((key) => (
                      <option key={key} value={key}>
                        {SORTS[key].label}
                      </option>
                    ))
                  )}
                </Select>
              </div>
              {query ? (
                <p className="text-xs text-ink-muted sm:ml-auto">
                  {visibleLinks.length} of {links.length} links
                </p>
              ) : null}
            </div>
            <Table
              loading={loading}
              head={
                <>
                  <Th>Short link</Th>
                  <Th className={COLUMNS.target}>Target</Th>
                  <Th align="right">Clicks</Th>
                  <Th align="right" className={COLUMNS.recentClicks}>
                    Last 7 days
                  </Th>
                  <Th className={COLUMNS.trend}>Last 30 days</Th>
                  <Th className={COLUMNS.created}>Created</Th>
                  <Th className={COLUMNS.actions} />
                </>
              }
              empty={
                Array.isNonEmptyReadonlyArray(links) ? (
                  <EmptyState
                    icon={<SearchIcon className="size-5" />}
                    title={`No short links match “${search.trim()}”`}
                    action={
                      <Button
                        size="sm"
                        onClick={() => {
                          setSearch('')
                        }}
                      >
                        Clear search
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<LinkIcon className="size-5" />}
                    title="No short links yet"
                    description={`Create one to get a ${hosts.shortLinks} address that is easy to share and print.`}
                    action={
                      <Button
                        variant="primary"
                        icon={<PlusIcon />}
                        onClick={openCreate}
                      >
                        New short link
                      </Button>
                    }
                  />
                )
              }
            >
              {pipe(
                visibleLinks,
                Array.map((link) => {
                  const open = () => {
                    setNotice(null)
                    setSelectedSlug(link.slug)
                  }
                  return (
                    <Tr key={link.slug}>
                      <Td>
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={open}
                            title="Show clicks and edit"
                            className="max-w-36 cursor-pointer truncate font-mono hover:underline sm:max-w-52"
                          >
                            <span className="hidden text-ink-subtle sm:inline">
                              {hosts.shortLinks}/
                            </span>
                            <span className="font-medium">{link.slug}</span>
                          </button>
                          <CopyButton
                            value={publicUrl(hosts.shortLinks, link.slug)}
                          />
                        </div>
                      </Td>
                      <Td
                        className={cx(
                          COLUMNS.target,
                          'w-full max-w-0 min-w-40'
                        )}
                      >
                        <a
                          href={link.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={link.targetUrl}
                          className="block truncate text-ink-muted hover:text-ink hover:underline"
                        >
                          {link.targetUrl}
                        </a>
                      </Td>
                      <Td align="right" className="tabular-nums">
                        {formatNumber(link.totalClicks)}
                      </Td>
                      <Td
                        align="right"
                        className={cx(COLUMNS.recentClicks, 'tabular-nums')}
                      >
                        {formatNumber(link.clicksLast7Days)}
                      </Td>
                      <Td className={COLUMNS.trend}>
                        <ShortLinkSparkline dailyClicks={link.dailyClicks} />
                      </Td>
                      <Td
                        className={cx(
                          COLUMNS.created,
                          'whitespace-nowrap text-ink-muted'
                        )}
                      >
                        {formatDate(link.createdAt)}
                      </Td>
                      <Td className={COLUMNS.actions}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<PencilIcon />}
                            onClick={open}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<TrashIcon />}
                            aria-label={`Delete ${link.slug}`}
                            title="Delete"
                            onClick={() => {
                              void handleDelete(link)
                            }}
                          />
                        </div>
                      </Td>
                    </Tr>
                  )
                })
              )}
            </Table>
          </Card>
        </>
      )}

      {creating ? (
        <CreateShortLinkModal
          takenSlugs={pipe(
            links,
            Array.map((link) => link.slug)
          )}
          onCreated={(link) => {
            setLinks((current) => [link, ...current])
          }}
          onClose={() => {
            setCreating(false)
          }}
        />
      ) : null}
      {selected ? (
        <ShortLinkDetailsModal
          key={selected.slug}
          link={selected}
          onUpdated={(updated) => {
            setLinks(
              Array.map((link) => (link.slug === updated.slug ? updated : link))
            )
          }}
          onDelete={() => {
            void handleDelete(selected)
          }}
          onClose={() => {
            setSelectedSlug(null)
          }}
        />
      ) : null}
      {dialog}
    </Page>
  )
}

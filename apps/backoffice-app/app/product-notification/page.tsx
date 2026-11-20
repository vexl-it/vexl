'use client'

import {
  Alert,
  Badge,
  BellIcon,
  Button,
  ButtonLink,
  Card,
  CopyButton,
  EmptyState,
  ExternalLinkIcon,
  Modal,
  Page,
  PageHeader,
  PlusIcon,
  SearchIcon,
  SearchInput,
  SegmentedControl,
  SortTh,
  StatCard,
  Table,
  Td,
  Th,
  Tr,
  type SegmentedOption,
  type SortState,
} from '@/src/components/ui'
import {useAdminApi} from '@/src/hooks/useAdminApi'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {
  makeBackofficeCommonHeaders,
  makeContentClient,
} from '@/src/services/contentAdminApi'
import {formatDateTime} from '@/src/services/format'
import {type VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {Array, Option, Order, pipe} from 'effect'
import {useCallback, useEffect, useState} from 'react'
import {
  DEFAULT_ACTION_TEXT,
  deliveryLabel,
  NOTIFICATION_TYPES,
  NotificationPreview,
  NotificationSummary,
  SummaryRow,
  type NotificationType,
} from './NotificationPreview'

type TypeFilter = 'ALL' | NotificationType

type SortKey = 'title' | 'date'

const TYPE_FILTERS: ReadonlyArray<SegmentedOption<TypeFilter>> = [
  {value: 'ALL', label: 'All'},
  {value: 'GENERAL', label: NOTIFICATION_TYPES.GENERAL.label},
  {value: 'MARKETING', label: NOTIFICATION_TYPES.MARKETING.label},
]

const NEW_NOTIFICATION_HREF = '/product-notification/new'
const DAY_MS = 86_400_000

const errorMessage = makeApiErrorMessage({})
const ORDERS: Record<SortKey, Order.Order<VexlProductNotification>> = {
  title: Order.mapInput(Order.string, ({title}) => title.toLowerCase()),
  date: Order.mapInput(Order.Date, ({date}) => date),
}
const relativeTime = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})

const timeAgo = (date: Date, now: Date): string => {
  const days = Math.round((date.getTime() - now.getTime()) / DAY_MS)
  return Math.abs(days) < 45
    ? relativeTime.format(days, 'day')
    : relativeTime.format(Math.round(days / 30), 'month')
}

const matches = (notification: VexlProductNotification, query: string) =>
  pipe(
    [
      notification.title,
      notification.description,
      notification.actionText ?? '',
      notification.actionLink ?? '',
      notification.uuid,
    ],
    Array.some((text) => text.toLowerCase().includes(query))
  )

interface History {
  readonly notifications: readonly VexlProductNotification[]
  readonly loadedAt: Date
}

export default function ProductNotificationsPage() {
  const api = useAdminApi(makeContentClient, errorMessage)
  const [history, setHistory] = useState<History | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: 'date',
    descending: true,
  })
  const [selected, setSelected] = useState<VexlProductNotification | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const result = await api((client) =>
        client.getVexlProductNotifications({
          headers: makeBackofficeCommonHeaders(),
          urlParams: {newerThan: new Date(0)},
        })
      )
      setHistory({
        notifications: result.vexlProductNotifications,
        loadedAt: new Date(),
      })
    } catch (loadError) {
      setError(errorMessage(loadError))
    }
  }, [api])

  useEffect(() => {
    void load()
  }, [load])

  const notifications = history?.notifications ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const visible = pipe(
    notifications,
    Array.filter(
      (notification) =>
        (typeFilter === 'ALL' || notification.type === typeFilter) &&
        matches(notification, normalizedQuery)
    ),
    Array.sort(
      sort.descending ? Order.reverse(ORDERS[sort.key]) : ORDERS[sort.key]
    )
  )
  const latest = pipe(
    notifications,
    Array.sort(Order.reverse(ORDERS.date)),
    Array.head
  )
  const pushCount = pipe(
    notifications,
    Array.filter((notification) => notification.issuePushNotification),
    Array.length
  )
  const marketingCount = pipe(
    notifications,
    Array.filter((notification) => notification.type === 'MARKETING'),
    Array.length
  )
  const closeDetail = () => {
    setSelected(null)
  }

  return (
    <Page>
      <PageHeader
        title="Product notifications"
        description="Announcements shown on the Notifications screen of the Vexl app, optionally with a push. Once sent, a notification cannot be edited or taken back."
        actions={
          <ButtonLink
            href={NEW_NOTIFICATION_HREF}
            variant="primary"
            icon={<PlusIcon />}
          >
            New notification
          </ButtonLink>
        }
      />

      {error ? (
        <Alert
          tone="error"
          title="Could not load the notifications"
          action={
            <Button size="sm" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {history && Array.isNonEmptyReadonlyArray(notifications) ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Sent" value={notifications.length} />
          <StatCard
            label="Last sent"
            value={pipe(
              latest,
              Option.match({
                onNone: () => '—',
                onSome: ({date}) => timeAgo(date, history.loadedAt),
              })
            )}
            hint={pipe(
              latest,
              Option.map(({title}) => title),
              Option.getOrUndefined
            )}
          />
          <StatCard
            label="With push"
            value={pushCount}
            hint={`${notifications.length - pushCount} in-app only`}
          />
          <StatCard
            label="Marketing"
            value={marketingCount}
            hint={`${notifications.length - marketingCount} general`}
          />
        </div>
      ) : null}

      <Card flush>
        {Array.isNonEmptyReadonlyArray(notifications) ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
            <SearchInput
              className="min-w-48 flex-1 sm:max-w-sm"
              aria-label="Search notifications"
              placeholder="Search title, text or link"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
            />
            <SegmentedControl
              label="Filter by type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_FILTERS}
            />
            <p className="ml-auto text-xs text-ink-muted tabular-nums">
              {visible.length} of {notifications.length}
            </p>
          </div>
        ) : null}
        <Table
          loading={history === null && error === null}
          head={
            <>
              <SortTh sortKey="title" sort={sort} onSort={setSort}>
                Notification
              </SortTh>
              <Th>Type</Th>
              <Th>Delivery</Th>
              <Th className="hidden lg:table-cell">Button</Th>
              <SortTh sortKey="date" sort={sort} onSort={setSort} align="right">
                Sent
              </SortTh>
            </>
          }
          empty={
            Array.isNonEmptyReadonlyArray(notifications) ? (
              <EmptyState
                icon={<SearchIcon className="size-5" />}
                title="No notifications match"
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setQuery('')
                      setTypeFilter('ALL')
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : error === null ? (
              <EmptyState
                icon={<BellIcon className="size-5" />}
                title="No notifications sent yet"
                description="Notifications you send to app users are listed here."
                action={
                  <ButtonLink
                    href={NEW_NOTIFICATION_HREF}
                    variant="primary"
                    icon={<PlusIcon />}
                  >
                    New notification
                  </ButtonLink>
                }
              />
            ) : null
          }
        >
          {Array.map(visible, (notification) => (
            <Tr
              key={notification.uuid}
              onClick={() => {
                setSelected(notification)
              }}
            >
              <Td className="max-w-xl min-w-64">
                <button
                  type="button"
                  className="cursor-pointer text-left font-medium hover:underline"
                >
                  {notification.title}
                </button>
                <p className="mt-0.5 line-clamp-2 text-ink-muted">
                  {notification.description}
                </p>
                <p className="mt-1 text-xs text-ink-subtle sm:hidden">
                  {formatDateTime(notification.date)} ·{' '}
                  {deliveryLabel(notification.issuePushNotification)}
                </p>
              </Td>
              <Td>
                <Badge
                  tone={
                    notification.type === 'MARKETING' ? 'accent' : 'neutral'
                  }
                >
                  {NOTIFICATION_TYPES[notification.type].label}
                </Badge>
              </Td>
              <Td>
                <Badge
                  tone={notification.issuePushNotification ? 'info' : 'neutral'}
                >
                  {deliveryLabel(notification.issuePushNotification)}
                </Badge>
              </Td>
              <Td className="hidden lg:table-cell">
                {notification.actionLink ? (
                  <a
                    href={notification.actionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:underline"
                    onClick={(event) => {
                      event.stopPropagation()
                    }}
                  >
                    {notification.actionText ?? DEFAULT_ACTION_TEXT}
                    <ExternalLinkIcon className="size-3.5 text-ink-subtle" />
                  </a>
                ) : (
                  <span className="text-ink-subtle">—</span>
                )}
              </Td>
              <Td
                align="right"
                className="whitespace-nowrap text-ink-muted tabular-nums"
              >
                {formatDateTime(notification.date)}
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>

      <Modal
        open={selected !== null}
        onClose={closeDetail}
        title={selected?.title}
        description={
          selected ? `Sent ${formatDateTime(selected.date)}` : undefined
        }
        size="lg"
        footer={<Button onClick={closeDetail}>Close</Button>}
      >
        {selected ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <NotificationPreview
              notification={selected}
              time={formatDateTime(selected.date)}
            />
            <NotificationSummary notification={selected}>
              <SummaryRow label="Notification ID">
                <span className="font-mono text-xs break-all">
                  {selected.uuid}
                </span>
                <span className="mt-1.5 block">
                  <CopyButton value={selected.uuid} label="Copy ID" />
                </span>
              </SummaryRow>
            </NotificationSummary>
          </div>
        ) : null}
      </Modal>
    </Page>
  )
}

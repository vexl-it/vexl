'use client'

import {
  Button,
  buttonClassName,
  ButtonLink,
  Card,
  EmptyState,
  ExternalLinkIcon,
  FormMessage,
  Input,
  Page,
  PageHeader,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SegmentedControl,
  SortTh,
  Table,
  Td,
  TdActions,
  Th,
  Tr,
  TrashIcon,
  useConfirm,
  type SortState,
} from '@/src/components/ui'
import {useCms} from '@/src/hooks/useCms'
import {cmsErrorMessage} from '@/src/services/cms/api'
import {type CmsResource} from '@/src/services/cms/resources'
import {type CmsStatus} from '@vexl-next/domain/src/general/cms'
import {Array, Option, Order, pipe} from 'effect'
import {useCallback, useEffect, useState, type ReactNode} from 'react'
import {StatusBadge} from './StatusBadge'

const PAGE_SIZE = 25

export interface CmsColumn<Item> {
  readonly header: string
  readonly render: (item: Item, editHref: string) => ReactNode
  /** Makes the column sortable. */
  readonly order?: Order.Order<Item>
}

export interface CmsView<Item> {
  readonly label: string
  readonly matches: (item: Item) => boolean
}

interface Props<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
> {
  readonly resource: CmsResource<Id, Item, Input>
  readonly title: string
  readonly description: string
  readonly columns: ReadonlyArray<CmsColumn<Item>>
  /** Filters offered next to "All", "Published" and "Drafts". */
  readonly views: ReadonlyArray<CmsView<Item>>
  readonly defaultSort: SortState<string>
  /** Shown before the edit, publish and delete actions of a row. */
  readonly rowAction?: (item: Item) => ReactNode
}

/** A row action that opens the item's public page in a new tab. */
export function OpenLinkAction({
  href,
  label,
}: {
  readonly href: string
  readonly label: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={buttonClassName({variant: 'ghost', size: 'sm'})}
    >
      <ExternalLinkIcon />
    </a>
  )
}

export function CmsListPage<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
>({
  resource,
  title,
  description,
  columns,
  views,
  defaultSort,
  rowAction,
}: Props<Id, Item, Input>) {
  const cms = useCms()
  const {confirm, dialog} = useConfirm()
  const [items, setItems] = useState<readonly Item[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<Id | null>(null)
  const [search, setSearch] = useState('')
  const [viewLabel, setViewLabel] = useState('All')
  const [sort, setSort] = useState(defaultSort)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setItems(await cms((client) => resource.list(client)))
    } catch (listError) {
      setLoadError(cmsErrorMessage(listError))
    } finally {
      setLoading(false)
    }
  }, [cms, resource])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const allViews: ReadonlyArray<CmsView<Item>> = [
    {label: 'All', matches: () => true},
    {label: 'Published', matches: (item) => item.status === 'published'},
    {label: 'Drafts', matches: (item) => item.status === 'draft'},
    ...views,
  ]
  const matchesView = pipe(
    allViews,
    Array.findFirst((view) => view.label === viewLabel),
    Option.match({onNone: () => () => true, onSome: (view) => view.matches})
  )
  const query = search.trim().toLowerCase()
  const order = pipe(
    columns,
    Array.findFirst((column) => column.header === sort.key),
    Option.flatMapNullable((column) => column.order),
    Option.map((one) => (sort.descending ? Order.reverse(one) : one))
  )
  const matching = pipe(
    items,
    Array.filter(
      (item) =>
        matchesView(item) &&
        resource.searchText(item).toLowerCase().includes(query)
    ),
    (filtered) =>
      Option.match(order, {
        onNone: () => filtered,
        onSome: (one) => Array.sort(filtered, one),
      })
  )
  const filtered = query !== '' || viewLabel !== 'All'

  const runAction = async (
    item: Item,
    action: () => Promise<void>,
    done: string
  ) => {
    setBusyId(item.id)
    setError(null)
    setSuccess(null)
    try {
      await action()
      setSuccess(`“${resource.name(item)}” ${done}.`)
    } catch (actionError) {
      setError(cmsErrorMessage(actionError))
    } finally {
      setBusyId(null)
    }
  }

  const handleSetStatus = async (item: Item, status: CmsStatus) => {
    const publishing = status === 'published'
    const confirmed = await confirm({
      title: `${publishing ? 'Publish' : 'Unpublish'} “${resource.name(item)}”?`,
      message: publishing
        ? `The ${resource.noun} goes to the website as it is saved now.`
        : `The ${resource.noun} disappears from the website and becomes a draft again.`,
      confirmLabel: publishing ? 'Publish' : 'Unpublish',
      tone: publishing ? 'primary' : 'danger',
    })
    if (!confirmed) return

    await runAction(
      item,
      async () => {
        const updated = await cms((client) =>
          resource.setStatus(client, item.id, status)
        )
        setItems((current) =>
          Array.map(current, (one) => (one.id === updated.id ? updated : one))
        )
      },
      publishing ? 'published' : 'unpublished'
    )
  }

  const handleDelete = async (item: Item) => {
    const confirmed = await confirm({
      title: `Delete “${resource.name(item)}”?`,
      message:
        item.status === 'published'
          ? `The ${resource.noun} is removed from the website too. This cannot be undone.`
          : 'This cannot be undone.',
      confirmLabel: 'Delete',
    })
    if (!confirmed) return

    await runAction(
      item,
      async () => {
        await cms((client) => resource.remove(client, item.id))
        setItems((current) =>
          Array.filter(current, (one) => one.id !== item.id)
        )
      },
      'deleted'
    )
  }

  const createButton = (
    <ButtonLink
      href={`${resource.path}/create`}
      variant="primary"
      icon={<PlusIcon />}
    >
      New {resource.noun}
    </ButtonLink>
  )

  return (
    <Page>
      <PageHeader
        title={title}
        description={description}
        actions={createButton}
      />
      <FormMessage error={loadError ?? error} success={success} />
      <Card flush>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-subtle" />
            <Input
              type="search"
              aria-label={`Search ${resource.nouns}`}
              placeholder={`Search ${resource.nouns}`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setLimit(PAGE_SIZE)
              }}
              className="pl-8"
            />
          </div>
          <div className="max-w-full overflow-x-auto">
            <SegmentedControl
              label="Filter"
              value={viewLabel}
              onChange={(label) => {
                setViewLabel(label)
                setLimit(PAGE_SIZE)
              }}
              options={Array.map(allViews, (view) => ({
                value: view.label,
                label: (
                  <>
                    {view.label}{' '}
                    <span className="text-ink-subtle">
                      {Array.filter(items, view.matches).length}
                    </span>
                  </>
                ),
              }))}
            />
          </div>
        </div>
        <Table
          loading={loading}
          head={
            <>
              {Array.map(columns, (column) =>
                column.order ? (
                  <SortTh
                    key={column.header}
                    sortKey={column.header}
                    sort={sort}
                    onSort={setSort}
                  >
                    {column.header}
                  </SortTh>
                ) : (
                  <Th key={column.header}>{column.header}</Th>
                )
              )}
              <Th className="hidden sm:table-cell">Status</Th>
              <Th />
            </>
          }
          empty={
            loadError ? (
              <EmptyState
                title={`Could not load the ${resource.nouns}`}
                action={
                  <Button
                    onClick={() => {
                      void loadItems()
                    }}
                  >
                    Try again
                  </Button>
                }
              />
            ) : filtered ? (
              <EmptyState
                icon={<SearchIcon className="size-5" />}
                title={`No ${resource.nouns} match`}
                action={
                  <Button
                    onClick={() => {
                      setSearch('')
                      setViewLabel('All')
                    }}
                  >
                    Clear search and filter
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title={`No ${resource.nouns} yet`}
                description={`Create the first ${resource.noun} and publish it when it is ready.`}
                action={createButton}
              />
            )
          }
        >
          {pipe(
            matching,
            Array.take(limit),
            Array.map((item) => {
              const editHref = `${resource.path}/${item.id}/edit`
              const statusBadge = (
                <StatusBadge
                  status={item.status}
                  visibleFrom={resource.visibleFrom?.(item)}
                />
              )
              return (
                <Tr key={item.id}>
                  {Array.map(columns, (column, index) => (
                    <Td key={column.header}>
                      {column.render(item, editHref)}
                      {index === 0 ? (
                        <div className="mt-1.5 sm:hidden">{statusBadge}</div>
                      ) : null}
                    </Td>
                  ))}
                  <Td className="hidden sm:table-cell">{statusBadge}</Td>
                  <TdActions>
                    {rowAction?.(item)}
                    <ButtonLink
                      href={editHref}
                      size="sm"
                      variant="ghost"
                      aria-label="Edit"
                      title="Edit"
                      icon={<PencilIcon />}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => {
                        void handleSetStatus(
                          item,
                          item.status === 'published' ? 'draft' : 'published'
                        )
                      }}
                    >
                      {item.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete"
                      title="Delete"
                      icon={<TrashIcon />}
                      disabled={busyId === item.id}
                      className="hover:text-danger"
                      onClick={() => {
                        void handleDelete(item)
                      }}
                    />
                  </TdActions>
                </Tr>
              )
            })
          )}
        </Table>
        {!loading && Array.isNonEmptyArray(matching) ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
            <span>
              Showing {Math.min(limit, matching.length)} of {matching.length}{' '}
              {filtered
                ? `matching (${items.length} in total)`
                : resource.nouns}
            </span>
            {matching.length > limit ? (
              <Button
                size="sm"
                onClick={() => {
                  setLimit(limit + PAGE_SIZE)
                }}
              >
                Show {Math.min(PAGE_SIZE, matching.length - limit)} more
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>
      {dialog}
    </Page>
  )
}

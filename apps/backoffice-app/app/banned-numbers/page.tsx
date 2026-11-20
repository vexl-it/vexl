'use client'

import {BanNumberModal} from '@/src/components/bannedNumbers/BanNumberModal'
import {
  Alert,
  BanIcon,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Input,
  Page,
  PageHeader,
  SearchIcon,
  Spinner,
  Table,
  Td,
  TdActions,
  Th,
  Tr,
  UploadIcon,
  useConfirm,
  type AlertTone,
} from '@/src/components/ui'
import {useBannedNumbersApi} from '@/src/hooks/useBannedNumbersApi'
import {bannedNumbersErrorMessage} from '@/src/services/bannedNumbers'
import {
  type BannedNumberAdminInfo,
  type BannedNumberId,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array} from 'effect'
import {useCallback, useEffect, useRef, useState} from 'react'

const PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 300
// Numbers are stored without formatting, so a pasted "+420 800 123 456" has to
// lose its separators to match.
const PHONE_NUMBER_SEPARATORS = /[\s().-]/g

const dateFormat = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium'})
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'short',
})

interface Feedback {
  readonly tone: AlertTone
  readonly message: string
}

export default function BannedNumbersPage() {
  const bannedNumbersApi = useBannedNumbersApi()
  const {confirm, dialog} = useConfirm()
  const [items, setItems] = useState<readonly BannedNumberAdminInfo[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [unbanningId, setUnbanningId] = useState<BannedNumberId | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.replace(PHONE_NUMBER_SEPARATORS, ''))
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timeout)
    }
  }, [searchInput])

  const latestLoadRef = useRef(0)
  const loadPage = useCallback(
    async (pageToken: string | null) => {
      latestLoadRef.current += 1
      const loadId = latestLoadRef.current
      const isSuperseded = (): boolean => loadId !== latestLoadRef.current

      setLoading(true)
      setLoadError(null)
      // A cursor only continues the search it came from.
      if (pageToken === null) setNextPageToken(null)
      try {
        const page = await bannedNumbersApi((client) =>
          client.listBannedNumbers({
            payload: {
              limit: PAGE_SIZE,
              search,
              nextPageToken: pageToken ?? undefined,
            },
          })
        )
        if (isSuperseded()) return

        setItems((current) =>
          pageToken === null ? page.items : [...current, ...page.items]
        )
        setNextPageToken(page.hasNext ? page.nextPageToken : null)
      } catch (error) {
        if (!isSuperseded()) setLoadError(bannedNumbersErrorMessage(error))
      } finally {
        if (!isSuperseded()) setLoading(false)
      }
    },
    [bannedNumbersApi, search]
  )

  // Bumped after banning, so the list reloads with the search that is active
  // by then.
  const [reloadCount, setReloadCount] = useState(0)
  useEffect(() => {
    void loadPage(null)
  }, [loadPage, reloadCount])

  const handleUnban = async (bannedNumber: BannedNumberAdminInfo) => {
    const confirmed = await confirm({
      title: `Unban ${bannedNumber.phoneNumber}?`,
      message:
        'People who both have this number in their contacts can be connected through it again.',
      confirmLabel: 'Unban',
    })
    if (!confirmed) return

    setFeedback(null)
    setUnbanningId(bannedNumber.id)
    try {
      await bannedNumbersApi((client) =>
        client.deleteBannedNumber({path: {id: bannedNumber.id}})
      )
      setItems(Array.filter((one) => one.id !== bannedNumber.id))
      setFeedback({
        tone: 'success',
        message: `Unbanned ${bannedNumber.phoneNumber}.`,
      })
    } catch (error) {
      setFeedback({tone: 'error', message: bannedNumbersErrorMessage(error)})
    } finally {
      setUnbanningId(null)
    }
  }

  const hasItems = Array.isNonEmptyReadonlyArray(items)
  const loadingFirstPage = loading && !hasItems

  return (
    <Page>
      <PageHeader
        title="Banned numbers"
        description="A banned number never connects two users as a common contact. Only for public service numbers like banks and carriers, never for private individuals."
        actions={
          <>
            <ButtonLink href="/banned-numbers/import" icon={<UploadIcon />}>
              Import CSV
            </ButtonLink>
            <Button
              variant="primary"
              icon={<BanIcon />}
              onClick={() => {
                setBanModalOpen(true)
              }}
            >
              Ban number
            </Button>
          </>
        }
      />

      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {loadError ? (
        <Alert
          tone="error"
          title="Could not load banned numbers"
          action={
            <Button
              size="sm"
              onClick={() => {
                void loadPage(null)
              }}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : null}

      <Card flush>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
              }}
              placeholder="Search by number"
              aria-label="Search banned numbers"
              className="pl-9 font-mono placeholder:font-sans"
            />
          </div>
          {loading && hasItems ? <Spinner className="text-ink-subtle" /> : null}
          {hasItems ? (
            <p className="text-sm text-ink-muted tabular-nums sm:ml-auto">
              {items.length}
              {nextPageToken === null ? '' : '+'}{' '}
              {search ? 'matching' : 'banned'}
            </p>
          ) : null}
        </div>

        <Table
          loading={loadingFirstPage}
          head={
            <>
              <Th>Number</Th>
              <Th className="hidden sm:table-cell">Note</Th>
              <Th>Banned</Th>
              <Th />
            </>
          }
          empty={
            loadError ? null : search ? (
              <EmptyState
                icon={<SearchIcon className="size-5" />}
                title={`No banned number contains “${search}”`}
                action={
                  <Button
                    onClick={() => {
                      setSearchInput('')
                    }}
                  >
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<BanIcon className="size-5" />}
                title="No banned numbers"
                description="Ban a single number, or import a list from a CSV file."
              />
            )
          }
        >
          {Array.map(items, (bannedNumber) => (
            <Tr key={String(bannedNumber.id)}>
              <Td>
                <span className="font-mono whitespace-nowrap">
                  {bannedNumber.phoneNumber}
                </span>
                {bannedNumber.note ? (
                  <span className="mt-0.5 block text-xs break-words text-ink-muted sm:hidden">
                    {bannedNumber.note}
                  </span>
                ) : null}
              </Td>
              <Td className="hidden min-w-56 break-words text-ink-muted sm:table-cell">
                {bannedNumber.note ?? '—'}
              </Td>
              <Td className="whitespace-nowrap text-ink-muted">
                <time
                  dateTime={bannedNumber.createdAt.toISOString()}
                  title={dateTimeFormat.format(bannedNumber.createdAt)}
                >
                  {dateFormat.format(bannedNumber.createdAt)}
                </time>
              </Td>
              <TdActions>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={unbanningId === bannedNumber.id}
                  onClick={() => {
                    void handleUnban(bannedNumber)
                  }}
                >
                  Unban
                </Button>
              </TdActions>
            </Tr>
          ))}
        </Table>

        {nextPageToken === null ? null : (
          <div className="flex justify-center border-t border-line px-4 py-3">
            <Button
              loading={loading}
              onClick={() => {
                void loadPage(nextPageToken)
              }}
            >
              Load more
            </Button>
          </div>
        )}
      </Card>

      <BanNumberModal
        open={banModalOpen}
        onClose={() => {
          setBanModalOpen(false)
        }}
        onBanned={(banFeedback) => {
          setFeedback(banFeedback)
          setReloadCount((count) => count + 1)
        }}
      />
      {dialog}
    </Page>
  )
}

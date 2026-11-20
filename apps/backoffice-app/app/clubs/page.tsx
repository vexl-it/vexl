'use client'

import {ClubAvatar} from '@/src/components/clubs/ClubAvatar'
import {ClubStatusBadge} from '@/src/components/clubs/ClubStatusBadge'
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CopyButton,
  cx,
  EmptyState,
  inputClassName,
  LinkIcon,
  Page,
  PageHeader,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SegmentedControl,
  SortTh,
  StatCard,
  Table,
  Td,
  TdActions,
  Th,
  Tr,
  UsersIcon,
  type SortState,
} from '@/src/components/ui'
import {useClubsApi} from '@/src/hooks/useClubsApi'
import {
  clubStatus,
  formatLocalDay,
  formatUtcDay,
  inactiveReasonLabel,
  inviteLinkPath,
} from '@/src/services/clubs'
import type {ClubAdminInfo} from '@vexl-next/domain/src/general/clubs'
import {Array, Option, Order, pipe} from 'effect'
import Link from 'next/link'
import {useCallback, useEffect, useState} from 'react'

type StatusFilter = 'all' | 'active' | 'inactive'
type SortKey = 'name' | 'members' | 'validUntil' | 'reports'

const ORDERS: Record<SortKey, Order.Order<ClubAdminInfo>> = {
  name: Order.mapInput(Order.string, (club) => club.name.toLowerCase()),
  members: Order.mapInput(Order.number, (club) => club.membersCount),
  validUntil: Order.mapInput(Order.Date, (club) => club.validUntil),
  reports: Order.mapInput(Order.number, (club) => club.report),
}

const isInactive = (club: ClubAdminInfo): boolean =>
  Option.isSome(club.madeInactiveAt)

const matchesStatus = (filter: StatusFilter) => (club: ClubAdminInfo) =>
  filter === 'all' || (filter === 'inactive') === isInactive(club)

const matchesSearch = (search: string) => (club: ClubAdminInfo) =>
  club.name.toLowerCase().includes(search) || club.uuid.includes(search)

function MemberChange({club}: {readonly club: ClubAdminInfo}) {
  if (club.membersJoinedLast30Days === 0 && club.membersLeftLast30Days === 0)
    return null
  return (
    <p className="text-xs text-ink-subtle">
      <span className="text-success-ink">+{club.membersJoinedLast30Days}</span>
      {' / '}
      <span className="text-danger-ink">−{club.membersLeftLast30Days}</span>
      {' in 30 d'}
    </p>
  )
}

function ClubRow({club}: {readonly club: ClubAdminInfo}) {
  const editHref = `/clubs/${club.uuid}/edit`
  const description = Option.getOrUndefined(club.description)

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-3">
          <ClubAvatar src={club.clubImageUrl} name={club.name} />
          <div className="min-w-0 max-w-56 2xl:max-w-96">
            <Link
              href={editHref}
              title={club.name}
              className="block truncate font-medium hover:underline"
            >
              {club.name}
            </Link>
            {description ? (
              <p title={description} className="truncate text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </Td>
      <Td>
        <ClubStatusBadge club={club} />
        {Option.isSome(club.madeInactiveAt) ? (
          <p className="mt-1 whitespace-nowrap text-xs text-ink-muted">
            {inactiveReasonLabel(club)}
            <span className="block">
              since {formatLocalDay(club.madeInactiveAt.value)}
            </span>
          </p>
        ) : null}
      </Td>
      <Td align="right" className="whitespace-nowrap tabular-nums">
        <span
          className={cx(
            club.membersCount >= club.membersCountLimit &&
              'font-medium text-warning-ink'
          )}
        >
          {club.membersCount}
        </span>
        <span className="text-ink-subtle"> / {club.membersCountLimit}</span>
        <MemberChange club={club} />
      </Td>
      <Td className="whitespace-nowrap">{formatUtcDay(club.validUntil)}</Td>
      <Td align="right" className="whitespace-nowrap tabular-nums">
        <span
          className={cx(
            club.report >= club.reportLimit && 'font-medium text-danger-ink'
          )}
        >
          {club.report}
        </span>
        <span className="text-ink-subtle"> / {club.reportLimit}</span>
      </Td>
      <TdActions>
        <span title="Copy the club UUID" className="font-mono">
          <CopyButton
            value={club.uuid}
            label={`${club.uuid.slice(0, 8)}…`}
            variant="ghost"
          />
        </span>
        <ButtonLink
          href={inviteLinkPath(club.uuid)}
          size="sm"
          variant="ghost"
          icon={<LinkIcon />}
        >
          Invite link
        </ButtonLink>
        <ButtonLink
          href={editHref}
          size="sm"
          variant="ghost"
          icon={<PencilIcon />}
        >
          Edit
        </ButtonLink>
      </TdActions>
    </Tr>
  )
}

export default function ClubsListPage() {
  const clubsApi = useClubsApi()
  const [clubs, setClubs] = useState<readonly ClubAdminInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: 'name',
    descending: false,
  })

  const loadClubs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setClubs((await clubsApi((client) => client.listClubs())).clubs)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load clubs'
      )
    } finally {
      setLoading(false)
    }
  }, [clubsApi])

  useEffect(() => {
    void loadClubs()
  }, [loadClubs])

  const inactiveCount = pipe(clubs, Array.filter(isInactive), Array.length)
  const expiringCount = pipe(
    clubs,
    Array.filter((club) => {
      const status = clubStatus(club)
      return status === 'expiresSoon' || status === 'expired'
    }),
    Array.length
  )
  const order = ORDERS[sort.key]
  const visibleClubs = pipe(
    clubs,
    Array.filter(matchesStatus(statusFilter)),
    Array.filter(matchesSearch(search.trim().toLowerCase())),
    Array.sort(sort.descending ? Order.reverse(order) : order)
  )
  const sortProps = {sort, onSort: setSort}
  const createClubLink = (
    <ButtonLink href="/clubs/create" variant="primary" icon={<PlusIcon />}>
      Create club
    </ButtonLink>
  )

  return (
    <Page>
      <PageHeader
        title="Clubs"
        description="Private groups in the Vexl app. People join a club with an invite link."
        actions={
          <>
            <ButtonLink href="/clubs/generate-link" icon={<LinkIcon />}>
              Generate invite link
            </ButtonLink>
            {createClubLink}
          </>
        }
      />

      {error ? (
        <Alert
          tone="error"
          action={
            <Button
              size="sm"
              icon={<RefreshIcon />}
              onClick={() => {
                void loadClubs()
              }}
            >
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active clubs"
          value={loading ? '–' : clubs.length - inactiveCount}
        />
        <StatCard
          label="Expiring"
          value={loading ? '–' : expiringCount}
          hint="Valid for 30 days or less"
        />
        <StatCard
          label="Inactive"
          value={loading ? '–' : inactiveCount}
          hint="Removed later by the cleanup job"
        />
        <StatCard
          label="Members"
          value={
            loading
              ? '–'
              : pipe(
                  clubs,
                  Array.reduce(0, (sum, club) => sum + club.membersCount)
                )
          }
          hint="Across all clubs"
        />
      </div>

      <Card flush>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="relative min-w-0 flex-1 basis-56 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
              placeholder="Search by name or UUID"
              aria-label="Search clubs by name or UUID"
              className={cx(inputClassName, 'h-9 pl-9')}
            />
          </div>
          <SegmentedControl
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              {value: 'all', label: `All ${clubs.length}`},
              {
                value: 'active',
                label: `Active ${clubs.length - inactiveCount}`,
              },
              {value: 'inactive', label: `Inactive ${inactiveCount}`},
            ]}
          />
        </div>
        <Table
          loading={loading}
          head={
            <>
              <SortTh sortKey="name" {...sortProps}>
                Club
              </SortTh>
              <Th>Status</Th>
              <SortTh sortKey="members" align="right" {...sortProps}>
                Members
              </SortTh>
              <SortTh sortKey="validUntil" {...sortProps}>
                Valid until
              </SortTh>
              <SortTh sortKey="reports" align="right" {...sortProps}>
                Reports
              </SortTh>
              <Th />
            </>
          }
          empty={
            Array.isNonEmptyReadonlyArray(clubs) ? (
              <EmptyState
                icon={<SearchIcon className="size-5" />}
                title="No clubs match"
                description="Try another name or UUID, or change the status filter."
              />
            ) : error ? null : (
              <EmptyState
                icon={<UsersIcon className="size-5" />}
                title="No clubs yet"
                description="Create a club, then generate an invite link for its first moderator."
                action={createClubLink}
              />
            )
          }
        >
          {Array.map(visibleClubs, (club) => (
            <ClubRow key={club.uuid} club={club} />
          ))}
        </Table>
      </Card>
    </Page>
  )
}

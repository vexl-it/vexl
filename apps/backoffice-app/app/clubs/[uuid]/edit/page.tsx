'use client'

import {ClubMemberActivityChart} from '@/src/components/ClubMemberActivityChart'
import {ClubAvatar} from '@/src/components/clubs/ClubAvatar'
import {ClubForm, clubFormValues} from '@/src/components/clubs/ClubForm'
import {ClubStatusBadge} from '@/src/components/clubs/ClubStatusBadge'
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CopyButton,
  EmptyState,
  LinkIcon,
  Page,
  PageHeader,
  RefreshIcon,
  StatCard,
  StatusMessage,
  useConfirm,
} from '@/src/components/ui'
import {useClubsApi} from '@/src/hooks/useClubsApi'
import {
  formatDaysUntil,
  formatLocalDay,
  formatUtcDay,
  inactiveReasonLabel,
  inviteLinkPath,
  reactivationBlocker,
} from '@/src/services/clubs'
import type {ClubAdminInfo} from '@vexl-next/domain/src/general/clubs'
import type {GetClubStatsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Option, pipe} from 'effect'
import {use, useCallback, useEffect, useState} from 'react'

type LoadState =
  | {readonly status: 'loading'}
  | {readonly status: 'failed'; readonly message: string}
  | {readonly status: 'notFound'}
  | {readonly status: 'loaded'; readonly club: ClubAdminInfo}

type StatsState = GetClubStatsResponse | {readonly error: string} | null

const errorText = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function InactiveClubAlert({
  club,
  onReactivated,
}: {
  readonly club: ClubAdminInfo
  readonly onReactivated: (club: ClubAdminInfo) => void
}) {
  const clubsApi = useClubsApi()
  const {confirm, dialog} = useConfirm()
  const [reactivating, setReactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocker = reactivationBlocker(club)
  const since = pipe(
    club.madeInactiveAt,
    Option.match({onNone: () => 'an unknown date', onSome: formatLocalDay})
  )

  const reactivate = async () => {
    const confirmed = await confirm({
      title: `Reactivate ${club.name}?`,
      message:
        'Members were already told the club was deactivated and most of their devices erased it. They will not get it back.',
      confirmLabel: 'Reactivate',
      tone: 'primary',
    })
    if (!confirmed) return

    setReactivating(true)
    setError(null)
    try {
      const {clubInfo} = await clubsApi((client) =>
        client.reactivateClub({payload: {clubUuid: club.uuid}})
      )
      onReactivated(clubInfo)
    } catch (reactivateError) {
      setError(errorText(reactivateError, 'Failed to reactivate the club.'))
    } finally {
      setReactivating(false)
    }
  }

  return (
    <Alert
      tone="warning"
      title={`Inactive since ${since}. ${inactiveReasonLabel(club)}.`}
      action={
        <Button
          size="sm"
          loading={reactivating}
          disabled={blocker !== null}
          onClick={() => {
            void reactivate()
          }}
        >
          Reactivate
        </Button>
      }
    >
      <p className="mt-1">
        Reactivating does not restore the club for its members. They were
        already notified and most of their devices erased the club data. If you
        are not sure, ask the developers first.
      </p>
      {(error ?? blocker) ? (
        <p className="mt-2 font-medium">{error ?? blocker}</p>
      ) : null}
      {dialog}
    </Alert>
  )
}

export default function EditClubPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{readonly uuid: string}>
  readonly searchParams: Promise<{readonly created?: string | string[]}>
}) {
  const {uuid} = use(params)
  const justCreated = use(searchParams).created !== undefined
  const clubsApi = useClubsApi()
  const [state, setState] = useState<LoadState>({status: 'loading'})
  const [stats, setStats] = useState<StatsState>(null)

  const load = useCallback(async () => {
    setState({status: 'loading'})
    setStats(null)
    try {
      const {clubs} = await clubsApi((client) => client.listClubs())
      const found = Array.findFirst(clubs, (club) => club.uuid === uuid)
      if (Option.isNone(found)) {
        setState({status: 'notFound'})
        return
      }
      setState({status: 'loaded', club: found.value})
      clubsApi((client) =>
        client.getClubStats({urlParams: {clubUuid: found.value.uuid}})
      ).then(setStats, (statsError: unknown) => {
        setStats({
          error: errorText(statsError, 'Failed to load member activity.'),
        })
      })
    } catch (loadError) {
      setState({
        status: 'failed',
        message: errorText(loadError, 'Failed to load the club.'),
      })
    }
  }, [clubsApi, uuid])

  useEffect(() => {
    void load()
  }, [load])

  const back = {href: '/clubs', label: 'Clubs'}

  if (state.status === 'loading')
    return <StatusMessage loading>Loading club…</StatusMessage>

  if (state.status === 'failed')
    return (
      <Page narrow>
        <PageHeader title="Edit club" back={back} />
        <Alert
          tone="error"
          action={
            <Button
              size="sm"
              icon={<RefreshIcon />}
              onClick={() => {
                void load()
              }}
            >
              Try again
            </Button>
          }
        >
          {state.message}
        </Alert>
      </Page>
    )

  if (state.status === 'notFound')
    return (
      <Page narrow>
        <PageHeader title="Edit club" back={back} />
        <Card>
          <EmptyState
            title="Club not found"
            description="No club has this UUID. It may have been removed after it was deactivated."
            action={<ButtonLink href="/clubs">Back to clubs</ButtonLink>}
          />
        </Card>
      </Page>
    )

  const {club} = state
  const setClub = (updated: ClubAdminInfo) => {
    setState({status: 'loaded', club: updated})
  }

  return (
    <Page>
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <ClubAvatar src={club.clubImageUrl} name={club.name} />
            <span className="min-w-0 break-words">{club.name}</span>
            <ClubStatusBadge club={club} />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <code className="break-all font-mono">{club.uuid}</code>
            <CopyButton value={club.uuid} label="Copy UUID" />
          </span>
        }
        actions={
          <ButtonLink href={inviteLinkPath(club.uuid)} icon={<LinkIcon />}>
            Generate invite link
          </ButtonLink>
        }
      />

      {justCreated ? (
        <Alert tone="success" title="Club created">
          It has no members yet. Generate an invite link and send it to the
          person who will moderate the club.
        </Alert>
      ) : null}

      {Option.isSome(club.madeInactiveAt) ? (
        <InactiveClubAlert club={club} onReactivated={setClub} />
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Members"
          value={club.membersCount}
          hint={`Limit ${club.membersCountLimit}`}
        />
        <StatCard
          label="Reports"
          value={club.report}
          hint={`Limit ${club.reportLimit}`}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Valid until"
            value={formatUtcDay(club.validUntil)}
            hint={formatDaysUntil(club.validUntil)}
          />
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card title="Member activity" className="xl:order-last">
          {stats === null ? (
            <StatusMessage loading>Loading member activity…</StatusMessage>
          ) : 'error' in stats ? (
            <Alert tone="error">{stats.error}</Alert>
          ) : (
            <ClubMemberActivityChart
              membersCount={stats.membersCount}
              changes={stats.changes}
            />
          )}
        </Card>
        <ClubForm
          initial={clubFormValues(club)}
          submitLabel="Save changes"
          successMessage="Changes saved."
          onSubmit={async (clubInfo) => {
            const saved = await clubsApi((client) =>
              client.modifyClub({payload: {clubInfo}})
            )
            setClub({...club, ...saved.clubInfo})
          }}
        />
      </div>
    </Page>
  )
}

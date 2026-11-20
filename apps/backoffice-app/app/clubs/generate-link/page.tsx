'use client'

import {ClubAvatar} from '@/src/components/clubs/ClubAvatar'
import {ClubStatusBadge} from '@/src/components/clubs/ClubStatusBadge'
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CopyButton,
  EmptyState,
  Field,
  Input,
  LinkIcon,
  Page,
  PageHeader,
  PlusIcon,
  Select,
  StatusMessage,
  UsersIcon,
} from '@/src/components/ui'
import {useClubsApi} from '@/src/hooks/useClubsApi'
import type {
  ClubAdminInfo,
  ClubLinkInfo,
} from '@vexl-next/domain/src/general/clubs'
import {Array, Option, pipe} from 'effect'
import {QRCodeSVG} from 'qrcode.react'
import {use, useEffect, useState} from 'react'

const errorText = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function CopyableValue({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex items-end gap-2">
      <Field label={label} className="min-w-0 flex-1">
        <Input
          readOnly
          value={value}
          className="font-mono"
          onFocus={(e) => {
            e.target.select()
          }}
        />
      </Field>
      <CopyButton value={value} size="md" />
    </div>
  )
}

export default function GenerateLinkPage({
  searchParams,
}: {
  readonly searchParams: Promise<{readonly club?: string | string[]}>
}) {
  const {club: requestedUuid} = use(searchParams)
  const clubsApi = useClubsApi()
  const [clubs, setClubs] = useState<readonly ClubAdminInfo[] | null>(null)
  const [selectedUuid, setSelectedUuid] = useState(
    typeof requestedUuid === 'string' ? requestedUuid : undefined
  )
  const [link, setLink] = useState<ClubLinkInfo | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    clubsApi((client) => client.listClubs()).then(
      (result) => {
        setClubs(result.clubs)
      },
      (loadError: unknown) => {
        setError(errorText(loadError, 'Failed to load clubs.'))
      }
    )
  }, [clubsApi])

  const back = {href: '/clubs', label: 'Clubs'}
  const header = (
    <PageHeader
      title="Generate invite link"
      description="Whoever opens the link in the Vexl app joins the club as a moderator. Each link works once. Moderators invite regular members from the app."
      back={back}
    />
  )

  if (clubs === null)
    return (
      <Page narrow>
        {header}
        {error ? (
          <Alert tone="error">{error}</Alert>
        ) : (
          <StatusMessage loading>Loading clubs…</StatusMessage>
        )}
      </Page>
    )

  const selected = pipe(
    clubs,
    Array.findFirst((club) => club.uuid === selectedUuid),
    Option.orElse(() => Array.head(clubs))
  )

  if (Option.isNone(selected))
    return (
      <Page narrow>
        {header}
        <Card>
          <EmptyState
            icon={<UsersIcon className="size-5" />}
            title="No clubs yet"
            description="Create a club first, then come back for its invite link."
            action={
              <ButtonLink
                href="/clubs/create"
                variant="primary"
                icon={<PlusIcon />}
              >
                Create club
              </ButtonLink>
            }
          />
        </Card>
      </Page>
    )

  const club = selected.value
  const generate = async () => {
    setGenerating(true)
    setError(null)
    setLink(null)
    try {
      const result = await clubsApi((client) =>
        client.generateClubInviteLinkForAdmin({payload: {clubUuid: club.uuid}})
      )
      setLink(result.link)
    } catch (generateError) {
      setError(errorText(generateError, 'Failed to generate the invite link.'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Page narrow>
      {header}

      <Card>
        <div className="space-y-5">
          <Field label="Club">
            <Select
              value={club.uuid}
              disabled={generating}
              onChange={(e) => {
                setSelectedUuid(e.target.value)
                setLink(null)
                setError(null)
              }}
            >
              {Array.map(clubs, (option) => (
                <option key={option.uuid} value={option.uuid}>
                  {option.name}
                  {Option.isSome(option.madeInactiveAt) ? ' (inactive)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <ClubAvatar src={club.clubImageUrl} name={club.name} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                <span className="min-w-0 break-words">{club.name}</span>
                <ClubStatusBadge club={club} />
              </p>
              <p className="break-all font-mono text-xs text-ink-muted">
                {club.uuid}
              </p>
              <p className="text-ink-muted">
                {club.membersCount} of {club.membersCountLimit} members
              </p>
            </div>
          </div>
          {Option.isSome(club.madeInactiveAt) ? (
            <Alert tone="warning">
              This club is inactive. Reactivate it on its edit page before you
              invite anyone.
            </Alert>
          ) : club.membersCount >= club.membersCountLimit ? (
            <Alert tone="warning">
              This club is full. The link will not work until you raise the
              member limit.
            </Alert>
          ) : null}
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex justify-end gap-2">
            <ButtonLink href={`/clubs/${club.uuid}/edit`}>Edit club</ButtonLink>
            <Button
              variant="primary"
              icon={<LinkIcon />}
              loading={generating}
              onClick={() => {
                void generate()
              }}
            >
              {link ? 'Generate another link' : 'Generate link'}
            </Button>
          </div>
        </div>
      </Card>

      {link ? (
        <Card
          title={`Invite link for ${club.name}`}
          description="Send it to the future moderator. It stops working after one person joins with it."
        >
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-5">
              <CopyableValue label="Link" value={link.fullLink} />
              <CopyableValue label="Code" value={link.code} />
            </div>
            <div className="justify-self-center rounded-control border border-line bg-white p-3">
              <QRCodeSVG value={link.fullLink} size={168} level="M" />
            </div>
          </div>
        </Card>
      ) : null}
    </Page>
  )
}

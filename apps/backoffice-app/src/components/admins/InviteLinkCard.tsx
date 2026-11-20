'use client'

import {Alert, Badge, Button, Card, CopyButton} from '@/src/components/ui'
import {formatTime} from '@/src/services/format'
import {type CreatedInvite} from './InviteModal'
import {SectionBadges} from './sections'
import {formatCountdown, useNow} from './time'

const LAST_MINUTE_MS = 60_000

export function InviteLinkCard({
  invite,
  onDismiss,
}: {
  readonly invite: CreatedInvite
  readonly onDismiss: () => void
}) {
  const remainingMs = new Date(invite.expiresAt).getTime() - useNow(1000)
  const dismiss = (
    <Button size="sm" variant="ghost" onClick={onDismiss}>
      Dismiss
    </Button>
  )

  if (remainingMs <= 0)
    return (
      <Alert tone="warning" action={dismiss}>
        The invite link for “{invite.label}” has expired. If they did not use it
        in time, create a new one.
      </Alert>
    )

  return (
    <Card
      title={`Invite link for “${invite.label}”`}
      actions={
        <>
          <Badge tone={remainingMs <= LAST_MINUTE_MS ? 'danger' : 'warning'}>
            Expires in {formatCountdown(remainingMs)}
          </Badge>
          {dismiss}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          Gives access to
          <SectionBadges sections={invite.sections} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 basis-64 break-all rounded-control border border-line bg-surface-muted px-3 py-2 font-mono text-xs text-ink">
            {invite.inviteUrl}
          </code>
          <CopyButton
            value={invite.inviteUrl}
            label="Copy link"
            variant="primary"
            size="md"
          />
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-muted">
          <li>
            Send the link to the new admin over a private channel. Whoever opens
            it first gets this access.
          </li>
          <li>
            They open it on the device they will sign in from and create a
            passkey there. That signs them in right away.
          </li>
          <li>
            The link works once and stops working at{' '}
            {formatTime(invite.expiresAt)}. It is shown only here: once you
            dismiss it or leave the page, create a new one.
          </li>
        </ol>
      </div>
    </Card>
  )
}

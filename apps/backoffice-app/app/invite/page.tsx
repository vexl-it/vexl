'use client'

import {AuthCard} from '@/src/components/AuthCard'
import {Button, StatusMessage} from '@/src/components/ui'
import {usePasskeyCeremony} from '@/src/hooks/usePasskeyCeremony'
import {registerFromInvite} from '@/src/services/access/api'
import {useEffect, useState} from 'react'

export default function InvitePage() {
  const {busy, error, run} = usePasskeyCeremony()
  // `undefined` until read on the client; `null` when the link has no token.
  const [inviteToken, setInviteToken] = useState<string | null>()

  useEffect(() => {
    // The token lives in the fragment so it never reaches any server log.
    setInviteToken(window.location.hash.slice(1) || null)
  }, [])

  if (inviteToken === undefined) {
    return (
      <StatusMessage fullScreen loading>
        Loading…
      </StatusMessage>
    )
  }

  if (inviteToken === null) {
    return (
      <AuthCard
        title="Incomplete invite link"
        subtitle="Part of the link is missing. Copy the whole link again, or ask an admin for a new one."
        error={null}
      />
    )
  }

  return (
    <AuthCard
      title="Join the backoffice"
      subtitle="You were invited as an admin. Create a passkey on this device to accept; you will sign in with it from now on."
      error={error}
    >
      <Button
        variant="primary"
        loading={busy}
        onClick={() => {
          void run(() => registerFromInvite(inviteToken))
        }}
        className="w-full"
      >
        {busy ? 'Waiting for your passkey…' : 'Create passkey'}
      </Button>
      <p className="text-xs text-ink-subtle">
        An invite link works once and expires 5 minutes after it was created. If
        this one no longer works, ask the admin for a new one.
      </p>
    </AuthCard>
  )
}

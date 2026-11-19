'use client'

import {AuthCard, primaryButtonClassName} from '@/src/components/AuthCard'
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
    return <AuthCard subtitle="Loading..." error={null} />
  }

  if (inviteToken === null) {
    return (
      <AuthCard
        subtitle="This invite link is incomplete. Ask an admin for a new one."
        error={null}
      />
    )
  }

  return (
    <AuthCard
      subtitle="You were invited to the backoffice. Create a passkey on this device to accept."
      error={error}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void run(() => registerFromInvite(inviteToken))
        }}
        className={primaryButtonClassName}
      >
        {busy ? 'Waiting for your passkey...' : 'Create passkey'}
      </button>
    </AuthCard>
  )
}

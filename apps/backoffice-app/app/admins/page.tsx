'use client'

import {EditSectionsModal} from '@/src/components/admins/EditSectionsModal'
import {InviteLinkCard} from '@/src/components/admins/InviteLinkCard'
import {
  type CreatedInvite,
  InviteModal,
} from '@/src/components/admins/InviteModal'
import {PasskeyTable} from '@/src/components/admins/PasskeyTable'
import {isAdmin} from '@/src/components/admins/sections'
import {useNow} from '@/src/components/admins/time'
import {
  Alert,
  Button,
  Page,
  PageHeader,
  PlusIcon,
  useConfirm,
} from '@/src/components/ui'
import {useBackofficeSession} from '@/src/hooks/useBackofficeSession'
import {deletePasskey, listPasskeys} from '@/src/services/access/api'
import {type Passkey} from '@/src/services/access/domain'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {Array} from 'effect'
import {useCallback, useEffect, useState} from 'react'

const errorMessage = makeApiErrorMessage({})

const POLL_WHILE_INVITED_MS = 5000

type SentInvite = CreatedInvite & {
  /** Passkeys that existed before the invite; a new one means it was used. */
  readonly knownPasskeyIds: readonly string[]
}

const soleId = (passkeys: readonly Passkey[]): string | null =>
  passkeys.length === 1 ? passkeys[0].id : null

export default function AdminsPage() {
  const sessionState = useBackofficeSession()
  const {confirm, dialog} = useConfirm()
  const now = useNow(60_000)
  const [passkeys, setPasskeys] = useState<readonly Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<Passkey | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [invites, setInvites] = useState<readonly SentInvite[]>([])

  const refresh = useCallback(async () => {
    setPasskeys(await listPasskeys())
  }, [])

  const load = useCallback(async () => {
    setError(null)
    try {
      await refresh()
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [refresh])

  useEffect(() => {
    void load()
  }, [load])

  const isAccepted = (invite: SentInvite): boolean =>
    Array.some(
      passkeys,
      (passkey) =>
        passkey.label === invite.label &&
        !Array.contains(invite.knownPasskeyIds, passkey.id)
    )
  const awaitingInvitee = Array.some(
    invites,
    (invite) =>
      !isAccepted(invite) && new Date(invite.expiresAt).getTime() > now
  )

  useEffect(() => {
    if (!awaitingInvitee) return
    const interval = setInterval(() => {
      // A failed poll is simply retried on the next tick.
      refresh().catch(() => undefined)
    }, POLL_WHILE_INVITED_MS)
    return () => {
      clearInterval(interval)
    }
  }, [awaitingInvitee, refresh])

  // The session carries only the label, so "you" is known when it is unique.
  const ownId =
    sessionState.status === 'signedIn'
      ? soleId(
          Array.filter(
            passkeys,
            (passkey) => passkey.label === sessionState.session.label
          )
        )
      : null
  const lastAdminId = soleId(Array.filter(passkeys, isAdmin))

  const handleRevoke = async (passkey: Passkey) => {
    const own = passkey.id === ownId
    const confirmed = await confirm({
      title: `Revoke the passkey “${passkey.label}”?`,
      message: own
        ? 'This is the passkey you are signed in with. You are signed out right away and stay locked out of the backoffice until another admin invites you again.'
        : 'Whoever uses it is signed out right away and can no longer sign in. This cannot be undone: to give the access back you have to send a new invite.',
      confirmLabel: 'Revoke passkey',
    })
    if (!confirmed) return

    setRevokingId(passkey.id)
    setNotice(null)
    setError(null)
    try {
      await deletePasskey(passkey.id)
      if (own) {
        window.location.assign('/login')
        return
      }
      setNotice(`Revoked the passkey “${passkey.label}”.`)
      await load()
    } catch (revokeError) {
      setError(errorMessage(revokeError))
    } finally {
      setRevokingId(null)
    }
  }

  const handleSaved = (saved: Passkey) => {
    // Without Admins the shell has to re-check what this session may open.
    if (saved.id === ownId && !isAdmin(saved)) {
      window.location.reload()
      return
    }
    setEditing(null)
    setNotice(`Updated the sections of “${saved.label}”.`)
    void load()
  }

  const inviteButton = (
    <Button
      variant="primary"
      icon={<PlusIcon />}
      onClick={() => {
        setInviting(true)
      }}
    >
      Invite admin
    </Button>
  )

  return (
    <Page>
      <PageHeader
        title="Admins"
        description="Every admin signs in with their own passkey and sees only the sections it allows. Changes apply immediately."
        actions={inviteButton}
      />

      {Array.map(invites, (invite) => (
        <InviteLinkCard
          key={invite.inviteUrl}
          invite={invite}
          accepted={isAccepted(invite)}
          onDismiss={() => {
            setInvites(Array.filter((other) => other !== invite))
          }}
        />
      ))}

      {error ? (
        <Alert
          tone="error"
          action={
            <Button
              size="sm"
              onClick={() => {
                void load()
              }}
            >
              Reload
            </Button>
          }
        >
          {error}
        </Alert>
      ) : notice ? (
        <Alert tone="success">{notice}</Alert>
      ) : null}

      <PasskeyTable
        passkeys={passkeys}
        loading={loading}
        ownId={ownId}
        lastAdminId={lastAdminId}
        revokingId={revokingId}
        inviteAction={inviteButton}
        onEdit={setEditing}
        onRevoke={(passkey) => {
          void handleRevoke(passkey)
        }}
      />

      {inviting ? (
        <InviteModal
          onClose={() => {
            setInviting(false)
          }}
          onCreated={(invite) => {
            setInviting(false)
            setInvites((current) => [
              {
                ...invite,
                knownPasskeyIds: Array.map(passkeys, (passkey) => passkey.id),
              },
              ...current,
            ])
          }}
        />
      ) : null}
      {editing ? (
        <EditSectionsModal
          passkey={editing}
          isOwn={editing.id === ownId}
          isLastAdmin={editing.id === lastAdminId}
          onClose={() => {
            setEditing(null)
          }}
          onSaved={handleSaved}
        />
      ) : null}
      {dialog}
    </Page>
  )
}

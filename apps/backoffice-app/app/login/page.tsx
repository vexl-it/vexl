'use client'

import {AuthCard} from '@/src/components/AuthCard'
import {Button, Field, Input, StatusMessage} from '@/src/components/ui'
import {usePasskeyCeremony} from '@/src/hooks/usePasskeyCeremony'
import {
  fetchSession,
  fetchSetupRequired,
  setUpFirstAdmin,
  signInWithPasskey,
} from '@/src/services/access/api'
import {homePath} from '@/src/services/access/navigation'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

type View = 'loading' | 'signIn' | 'setup'

export default function LoginPage() {
  const router = useRouter()
  const {busy, error, setError, run} = usePasskeyCeremony()
  const [view, setView] = useState<View>('loading')
  const [adminToken, setAdminToken] = useState('')
  const [label, setLabel] = useState('')

  useEffect(() => {
    const load = async () => {
      const session = await fetchSession()
      if (session) {
        router.replace(homePath(session.sections))
        return
      }
      setView((await fetchSetupRequired()) ? 'setup' : 'signIn')
    }
    load().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Failed')
      setView('signIn')
    })
  }, [router, setError])

  if (view === 'loading') {
    return (
      <StatusMessage fullScreen loading>
        Loading…
      </StatusMessage>
    )
  }

  if (view === 'signIn') {
    return (
      <AuthCard
        title="Sign in"
        subtitle="Use the passkey you registered for the backoffice."
        error={error}
      >
        <Button
          variant="primary"
          loading={busy}
          onClick={() => {
            void run(signInWithPasskey)
          }}
          className="w-full"
        >
          {busy ? 'Waiting for your passkey…' : 'Sign in with passkey'}
        </Button>
        <p className="text-xs text-ink-subtle">
          No passkey yet? Ask an admin for an invite link.
        </p>
      </AuthCard>
    )
  }

  const handleSetup = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(() => setUpFirstAdmin(adminToken.trim(), label.trim()))
  }

  return (
    <AuthCard
      title="Set up the first admin"
      subtitle="No passkey exists yet. The one you create now gets access to every section and can invite the other admins."
      error={error}
    >
      <form onSubmit={handleSetup} className="space-y-4">
        <Field
          label="Admin token"
          required
          hint="The ADMIN_TOKEN this server runs with. It is checked once and never stored in the browser."
        >
          <Input
            type="password"
            required
            value={adminToken}
            onChange={(event) => {
              setAdminToken(event.target.value)
            }}
            autoComplete="off"
          />
        </Field>
        <Field
          label="Passkey label"
          required
          hint="Shown in the Admins list so others know whose passkey it is."
        >
          <Input
            type="text"
            required
            maxLength={100}
            value={label}
            onChange={(event) => {
              setLabel(event.target.value)
            }}
            placeholder="e.g. Work laptop"
            autoComplete="off"
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          className="w-full"
        >
          {busy ? 'Waiting for your passkey…' : 'Set up first admin'}
        </Button>
      </form>
    </AuthCard>
  )
}

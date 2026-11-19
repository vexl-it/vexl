'use client'

import {
  AuthCard,
  inputClassName,
  primaryButtonClassName,
} from '@/src/components/AuthCard'
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
    return <AuthCard subtitle="Loading..." error={error} />
  }

  if (view === 'signIn') {
    return (
      <AuthCard subtitle="Sign in with your passkey" error={error}>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void run(signInWithPasskey)
          }}
          className={primaryButtonClassName}
        >
          {busy ? 'Waiting for your passkey...' : 'Sign in with passkey'}
        </button>
      </AuthCard>
    )
  }

  const handleSetup = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(() => setUpFirstAdmin(adminToken.trim(), label.trim()))
  }

  return (
    <AuthCard
      subtitle="Set up the first admin. The new passkey gets access to every section."
      error={error}
    >
      <form onSubmit={handleSetup} className="space-y-4">
        <div>
          <label
            htmlFor="admin-token"
            className="block text-sm font-medium text-gray-700"
          >
            Admin token
          </label>
          <input
            id="admin-token"
            type="password"
            required
            value={adminToken}
            onChange={(event) => {
              setAdminToken(event.target.value)
            }}
            className={inputClassName}
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="passkey-label"
            className="block text-sm font-medium text-gray-700"
          >
            Passkey label
          </label>
          <input
            id="passkey-label"
            type="text"
            required
            maxLength={100}
            value={label}
            onChange={(event) => {
              setLabel(event.target.value)
            }}
            className={inputClassName}
            placeholder="e.g. Work laptop"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className={primaryButtonClassName}
        >
          {busy ? 'Waiting for your passkey...' : 'Set up first admin'}
        </button>
      </form>
    </AuthCard>
  )
}

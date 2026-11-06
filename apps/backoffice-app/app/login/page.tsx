'use client'

import {requestJson} from '@/src/services/adminFetch'
import {
  BackofficeRole,
  homePathForRole,
  setSession,
} from '@/src/services/adminTokenService'
import {Schema} from 'effect'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

const SessionResponse = Schema.Struct({role: BackofficeRole})

const fetchRole = async (token: string): Promise<BackofficeRole> => {
  const response = await requestJson<unknown>('/api/admin/session', {
    method: 'GET',
    headers: {'x-admin-token': token},
  })
  return Schema.decodeUnknownSync(SessionResponse)(response).role
}

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const trimmedToken = token.trim()
    if (!trimmedToken) {
      setError('Admin token is required')
      return
    }

    try {
      const role = await fetchRole(trimmedToken)
      setSession(trimmedToken, role)
      router.push(homePathForRole(role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Vexl Backoffice
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your admin token
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="admin-token" className="sr-only">
                Admin Token
              </label>
              <input
                id="admin-token"
                name="admin-token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                }}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your admin token"
                autoComplete="off"
              />
            </div>
          </div>

          {!!error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

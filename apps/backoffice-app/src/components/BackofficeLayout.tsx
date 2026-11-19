'use client'

import {useBackofficeSession} from '@/src/hooks/useBackofficeSession'
import {signOut} from '@/src/services/access/api'
import {type BackofficeSection} from '@/src/services/access/domain'
import {isCurrent, permittedNavigation} from '@/src/services/access/navigation'
import {Array} from 'effect'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useEffect} from 'react'

export function StatusMessage({children}: {children: React.ReactNode}) {
  return (
    <div className="flex justify-center items-center py-24 px-4 text-center text-gray-600">
      {children}
    </div>
  )
}

export function BackofficeLayout({
  section,
  children,
}: {
  section: BackofficeSection
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const sessionState = useBackofficeSession()

  useEffect(() => {
    if (sessionState.status === 'signedOut') router.replace('/login')
  }, [sessionState.status, router])

  if (sessionState.status === 'loading' || sessionState.status === 'signedOut')
    return <StatusMessage>Loading...</StatusMessage>
  if (sessionState.status === 'failed')
    return <StatusMessage>{sessionState.message}</StatusMessage>

  const {session} = sessionState
  const navigation = permittedNavigation(session.sections)

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Vexl Backoffice
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {Array.map(navigation, (item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isCurrent(item, pathname)
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden xl:inline text-sm text-gray-500">
                {session.label}
              </span>
              <button
                onClick={() => {
                  void handleLogout()
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="sm:hidden px-2 pt-2 pb-3 space-y-1">
          {Array.map(navigation, (item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isCurrent(item, pathname)
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6">
        {Array.contains(session.sections, section) ? (
          children
        ) : (
          <StatusMessage>
            You do not have access to this section. Ask an admin to grant it.
          </StatusMessage>
        )}
      </main>
    </div>
  )
}

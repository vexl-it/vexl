'use client'

import {Brand, Sidebar} from '@/src/components/Sidebar'
import {
  closeOnBackdropClick,
  EmptyState,
  LockIcon,
  MenuIcon,
  StatusMessage,
  useModalDialog,
} from '@/src/components/ui'
import {useBackofficeSession} from '@/src/hooks/useBackofficeSession'
import {signOut} from '@/src/services/access/api'
import {type BackofficeSection} from '@/src/services/access/domain'
import {Array} from 'effect'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

export function BackofficeLayout({
  section,
  children,
}: {
  section: BackofficeSection
  children: React.ReactNode
}) {
  const router = useRouter()
  const sessionState = useBackofficeSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useModalDialog(drawerOpen)

  useEffect(() => {
    if (sessionState.status === 'signedOut') router.replace('/login')
  }, [sessionState.status, router])

  if (sessionState.status === 'loading' || sessionState.status === 'signedOut')
    return (
      <StatusMessage fullScreen loading>
        Loading…
      </StatusMessage>
    )
  if (sessionState.status === 'failed')
    return <StatusMessage fullScreen>{sessionState.message}</StatusMessage>

  const {session} = sessionState
  const closeDrawer = () => {
    setDrawerOpen(false)
  }
  const handleSignOut = () => {
    signOut().finally(() => {
      router.push('/login')
    })
  }
  const sidebar = (
    <Sidebar
      session={session}
      onNavigate={closeDrawer}
      onSignOut={handleSignOut}
    />
  )

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        {sidebar}
      </aside>
      <dialog
        ref={drawerRef}
        aria-label="Navigation"
        onClose={closeDrawer}
        onClick={closeOnBackdropClick(closeDrawer)}
        className="m-0 h-dvh max-h-none w-64 max-w-[85vw] backdrop:bg-ink/60"
      >
        {sidebar}
      </dialog>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-sidebar-line bg-sidebar px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => {
              setDrawerOpen(true)
            }}
            className="-ml-1.5 flex size-9 cursor-pointer items-center justify-center rounded-full text-sidebar-ink-strong hover:bg-sidebar-hover"
          >
            <MenuIcon className="size-5" />
          </button>
          <Brand />
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="max-w-[1600px]">
            {Array.contains(session.sections, section) ? (
              children
            ) : (
              <EmptyState
                icon={<LockIcon className="size-5" />}
                title="No access to this section"
                description="Your passkey cannot open this section. Ask an admin to grant it."
                className="py-24"
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

'use client'

import {StatusMessage} from '@/src/components/BackofficeLayout'
import {useBackofficeSession} from '@/src/hooks/useBackofficeSession'
import {homePath} from '@/src/services/access/navigation'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

export default function HomePage() {
  const router = useRouter()
  const sessionState = useBackofficeSession()
  const target =
    sessionState.status === 'signedOut'
      ? '/login'
      : sessionState.status === 'signedIn'
        ? homePath(sessionState.session.sections)
        : null

  useEffect(() => {
    if (target !== null && target !== '/') router.replace(target)
  }, [target, router])

  if (sessionState.status === 'failed') {
    return <StatusMessage>{sessionState.message}</StatusMessage>
  }
  if (target === '/') {
    return (
      <StatusMessage>
        Your passkey does not have access to any section yet.
      </StatusMessage>
    )
  }
  return <StatusMessage>Redirecting...</StatusMessage>
}

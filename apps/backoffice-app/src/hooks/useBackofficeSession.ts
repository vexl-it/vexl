import {fetchSession} from '@/src/services/access/api'
import {type BackofficeSession} from '@/src/services/access/domain'
import {useEffect, useState} from 'react'

export type SessionState =
  | {readonly status: 'loading'}
  | {readonly status: 'signedOut'}
  | {readonly status: 'signedIn'; readonly session: BackofficeSession}
  | {readonly status: 'failed'; readonly message: string}

export function useBackofficeSession(): SessionState {
  const [state, setState] = useState<SessionState>({status: 'loading'})

  useEffect(() => {
    fetchSession()
      .then((session) => {
        setState(
          session ? {status: 'signedIn', session} : {status: 'signedOut'}
        )
      })
      .catch((error: unknown) => {
        setState({
          status: 'failed',
          message: error instanceof Error ? error.message : 'Failed to load',
        })
      })
  }, [])

  return state
}

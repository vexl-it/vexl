import {type BackofficeSession} from '@/src/services/access/domain'
import {homePath} from '@/src/services/access/navigation'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

const ceremonyErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Something went wrong'
  // What browsers throw when the passkey prompt is dismissed or times out.
  if (error.name === 'NotAllowedError')
    return 'The passkey prompt was closed or timed out. Try again.'
  return error.message
}

/** Runs a sign-in or registration and opens the first permitted page. */
export function usePasskeyCeremony() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Sign-in used to keep the raw admin token here; drop it from old browsers.
    localStorage.removeItem('vexl_admin_token')
    localStorage.removeItem('vexl_backoffice_role')
  }, [])

  const run = async (
    ceremony: () => Promise<BackofficeSession>
  ): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const session = await ceremony()
      router.replace(homePath(session.sections))
    } catch (ceremonyError) {
      setError(ceremonyErrorMessage(ceremonyError))
      setBusy(false)
    }
  }

  return {busy, error, setError, run}
}

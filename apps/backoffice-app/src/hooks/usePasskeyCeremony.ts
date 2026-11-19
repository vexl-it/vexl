import {type BackofficeSession} from '@/src/services/access/domain'
import {homePath} from '@/src/services/access/navigation'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

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
      setError(
        ceremonyError instanceof Error
          ? ceremonyError.message
          : 'Something went wrong'
      )
      setBusy(false)
    }
  }

  return {busy, error, setError, run}
}

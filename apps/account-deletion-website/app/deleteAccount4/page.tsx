'use client'

import {STORAGE_KEYPAIR_KEY} from '@/src/client/session'
import {useRouter} from 'next/navigation'
import {useEffect, useEffectEvent} from 'react'

export default function DeleteAccount4Page() {
  const router = useRouter()
  const redirectHome = useEffectEvent(() => {
    router.replace('/')
  })

  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEYPAIR_KEY)

    const timeoutId = window.setTimeout(() => {
      redirectHome()
    }, 5000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [redirectHome])

  return <p>Account deleted. We are sorry, to see you go 😥.</p>
}

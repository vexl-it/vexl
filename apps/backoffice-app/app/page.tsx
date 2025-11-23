'use client'

import {getAdminToken} from '@/src/services/adminTokenService'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      router.push('/login')
    } else {
      router.push('/clubs')
    }
  }, [router])

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-gray-600">Redirecting...</div>
    </div>
  )
}

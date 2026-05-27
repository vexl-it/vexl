'use client'

import {SlideshowForm} from '@/src/components/slideshows/SlideshowForm'
import {getAdminToken} from '@/src/services/adminTokenService'
import {createSlideshow} from '@/src/services/slideshows/api'
import {type SlideshowSlides} from '@/src/services/slideshows/domain'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

interface SubmitData {
  readonly name: string
  readonly publicSlug: string | null
  readonly isEnabled: boolean
  readonly slides: SlideshowSlides
}

export default function CreateSlideshowPage() {
  const [slideshowUuid] = useState(() => crypto.randomUUID())
  const router = useRouter()

  useEffect(() => {
    if (!getAdminToken()) router.push('/login')
  }, [router])

  const handleSubmit = async (data: SubmitData) => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    const result = await createSlideshow(adminToken, {
      uuid: slideshowUuid,
      name: data.name,
      publicSlug: data.publicSlug,
      isEnabled: data.isEnabled,
      slides: data.slides,
    })

    router.push(`/slideshows/${result.slideshow.uuid}/edit`)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create slideshow
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure slides for a public TV display URL
          </p>
        </div>
      </div>

      <SlideshowForm
        slideshowUuid={slideshowUuid}
        initialName=""
        initialPublicSlug={null}
        initialIsEnabled={true}
        initialSlides={[]}
        submitLabel="Create slideshow"
        submittingLabel="Creating..."
        onSubmit={handleSubmit}
      />
    </div>
  )
}

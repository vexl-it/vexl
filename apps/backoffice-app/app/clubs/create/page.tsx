'use client'

import {ClubForm} from '@/src/components/clubs/ClubForm'
import {Page, PageHeader} from '@/src/components/ui'
import {useClubsApi} from '@/src/hooks/useClubsApi'
import {useRouter} from 'next/navigation'

export default function CreateClubPage() {
  const clubsApi = useClubsApi()
  const router = useRouter()

  return (
    <Page narrow>
      <PageHeader
        title="Create club"
        description="The club is empty until its first moderator joins with an invite link. You generate that link in the next step."
        back={{href: '/clubs', label: 'Clubs'}}
      />
      <ClubForm
        submitLabel="Create club"
        onSubmit={async (club) => {
          await clubsApi((client) => client.createClub({payload: {club}}))
          router.push(`/clubs/${club.uuid}/edit?created=1`)
        }}
      />
    </Page>
  )
}

'use client'

import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function ClubsLayout({children}: {children: React.ReactNode}) {
  return <BackofficeLayout section="clubs">{children}</BackofficeLayout>
}

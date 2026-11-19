'use client'

import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function ProductNotificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BackofficeLayout section="productNotifications">
      {children}
    </BackofficeLayout>
  )
}

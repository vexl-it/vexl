import {AnalyticsShell} from '@/src/components/analytics/AnalyticsShell'
import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BackofficeLayout>
      <AnalyticsShell>{children}</AnalyticsShell>
    </BackofficeLayout>
  )
}

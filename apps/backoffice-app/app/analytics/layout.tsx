import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackofficeLayout>{children}</BackofficeLayout>
}

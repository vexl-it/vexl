import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function BannedNumbersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackofficeLayout section="bannedNumbers">{children}</BackofficeLayout>
}

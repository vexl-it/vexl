import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function ShortLinksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackofficeLayout>{children}</BackofficeLayout>
}

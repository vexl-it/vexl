import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function ShortLinksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackofficeLayout section="shortLinks">{children}</BackofficeLayout>
}

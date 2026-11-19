import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function SlideshowsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackofficeLayout section="slideshows">{children}</BackofficeLayout>
}

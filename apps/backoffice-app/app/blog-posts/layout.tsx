import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function BlogPostsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackofficeLayout>{children}</BackofficeLayout>
}

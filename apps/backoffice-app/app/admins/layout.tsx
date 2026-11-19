import {BackofficeLayout} from '@/src/components/BackofficeLayout'

export default function AdminsLayout({children}: {children: React.ReactNode}) {
  return <BackofficeLayout section="admins">{children}</BackofficeLayout>
}

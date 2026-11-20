import {Brand} from '@/src/components/Sidebar'
import {Alert} from '@/src/components/ui'

export function AuthCard({
  title,
  subtitle,
  error,
  children,
}: {
  readonly title: string
  readonly subtitle: string
  readonly error: string | null
  readonly children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-card border border-line bg-surface p-8 shadow-card">
        <Brand />
        <div>
          <h1 className="text-xl text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
        </div>
        {children}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    </div>
  )
}

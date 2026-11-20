import {type ReactNode} from 'react'
import {cx} from './cx'
import {Spinner} from './Spinner'

export function StatusMessage({
  children,
  loading = false,
  fullScreen = false,
}: {
  readonly children: ReactNode
  readonly loading?: boolean
  readonly fullScreen?: boolean
}) {
  return (
    <div
      role="status"
      className={cx(
        'flex flex-col items-center justify-center gap-3 px-4 text-center text-sm text-ink-muted',
        fullScreen ? 'min-h-screen' : 'min-h-64 py-16'
      )}
    >
      {loading ? <Spinner className="size-5 text-ink-subtle" /> : null}
      {children}
    </div>
  )
}

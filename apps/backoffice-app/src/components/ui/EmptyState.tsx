import {type ReactNode} from 'react'
import {cx} from './cx'
import {InboxIcon} from './icons'

export function EmptyState({
  icon = <InboxIcon className="size-5" />,
  title,
  description,
  action,
  className,
}: {
  readonly icon?: ReactNode
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly action?: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center px-6 py-12 text-center',
        className
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

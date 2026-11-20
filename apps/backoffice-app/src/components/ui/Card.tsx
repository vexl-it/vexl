import {type ReactNode} from 'react'
import {cx} from './cx'

export function Card({
  title,
  description,
  actions,
  flush = false,
  className,
  children,
}: {
  readonly title?: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly flush?: boolean
  readonly className?: string
  readonly children: ReactNode
}) {
  return (
    <section
      className={cx(
        'overflow-hidden rounded-card border border-line bg-surface',
        className
      )}
    >
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={flush ? undefined : 'p-5'}>{children}</div>
    </section>
  )
}

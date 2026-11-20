import Link from 'next/link'
import {type ReactNode} from 'react'
import {cx} from './cx'
import {ArrowLeftIcon} from './icons'

export function Page({
  children,
  narrow = false,
}: {
  readonly children: ReactNode
  readonly narrow?: boolean
}) {
  return (
    <div className={cx('space-y-6', narrow && 'max-w-3xl')}>{children}</div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly back?: {readonly href: string; readonly label: string}
}) {
  return (
    <header>
      {back ? (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon className="size-3.5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight text-ink">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

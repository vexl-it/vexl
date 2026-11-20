import {type ReactNode} from 'react'
import {cx} from './cx'
import {AlertCircleIcon, CheckCircleIcon, InfoIcon, type Icon} from './icons'

export type AlertTone = 'error' | 'success' | 'info' | 'warning'

const TONES: Record<
  AlertTone,
  {readonly className: string; readonly Icon: Icon}
> = {
  error: {
    className: 'bg-danger-soft text-danger-ink',
    Icon: AlertCircleIcon,
  },
  success: {
    className: 'bg-success-soft text-success-ink',
    Icon: CheckCircleIcon,
  },
  info: {
    className: 'bg-info-soft text-info-ink',
    Icon: InfoIcon,
  },
  warning: {
    className: 'bg-warning-soft text-warning-ink',
    Icon: AlertCircleIcon,
  },
}

export function Alert({
  tone = 'info',
  title,
  action,
  className,
  children,
}: {
  readonly tone?: AlertTone
  readonly title?: ReactNode
  readonly action?: ReactNode
  readonly className?: string
  readonly children?: ReactNode
}) {
  const {className: toneClassName, Icon} = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2.5 rounded-control px-3.5 py-3 text-sm',
        toneClassName,
        className
      )}
    >
      <Icon className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 break-words">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function FormMessage({
  error,
  success,
}: {
  readonly error: string | null
  readonly success?: string | null
}) {
  if (error) return <Alert tone="error">{error}</Alert>
  if (success) return <Alert tone="success">{success}</Alert>
  return null
}

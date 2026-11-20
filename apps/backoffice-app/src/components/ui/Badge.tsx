import {type ReactNode} from 'react'

export type Tone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'

const TONES: Record<Tone, string> = {
  neutral: 'bg-line text-ink-muted',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-info-soft text-info-ink',
  accent: 'bg-accent-soft text-accent-ink',
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  readonly tone?: Tone
  readonly children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[10px_2px] px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

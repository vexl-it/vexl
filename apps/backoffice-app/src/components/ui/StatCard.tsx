import {type ReactNode} from 'react'

export function StatCard({
  label,
  value,
  hint,
}: {
  readonly label: ReactNode
  readonly value: ReactNode
  readonly hint?: ReactNode
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-5 py-4">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-2xl leading-none tracking-[-0.04em] tabular-nums text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}

import {type ComponentProps, type ReactNode} from 'react'
import {cx} from './cx'

export const inputClassName =
  'block w-full rounded-control border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-ink-subtle focus:border-focus focus:ring-3 focus:ring-accent/40 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-muted disabled:text-ink-muted aria-invalid:border-danger aria-invalid:focus:ring-danger/20'

export function Field({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: {
  readonly label: ReactNode
  readonly hint?: ReactNode
  readonly error?: ReactNode
  readonly required?: boolean
  readonly className?: string
  readonly children: ReactNode
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-danger-ink">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  )
}

interface ControlProps {
  readonly invalid?: boolean
}

export function Input({
  invalid,
  className,
  ...props
}: ComponentProps<'input'> & ControlProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cx(inputClassName, 'h-9', className)}
      {...props}
    />
  )
}

export function Textarea({
  invalid,
  className,
  ...props
}: ComponentProps<'textarea'> & ControlProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cx(inputClassName, className)}
      {...props}
    />
  )
}

export function Select({
  invalid,
  className,
  ...props
}: ComponentProps<'select'> & ControlProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cx(inputClassName, 'h-9 pr-8', className)}
      {...props}
    />
  )
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
  readonly label: ReactNode
  readonly description?: ReactNode
}) {
  return (
    <label className={cx('flex items-start gap-2.5 text-sm', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-ink disabled:cursor-not-allowed"
        {...props}
      />
      <span>
        <span className="font-semibold text-ink">{label}</span>
        {description ? (
          <span className="block text-ink-muted">{description}</span>
        ) : null}
      </span>
    </label>
  )
}

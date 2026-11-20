import Link from 'next/link'
import {type ComponentProps, type ReactNode} from 'react'
import {cx} from './cx'
import {Spinner} from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

interface ButtonStyle {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly icon?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  secondary:
    'bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  ghost: 'text-ink-muted hover:bg-line hover:text-ink',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm',
}

export const buttonClassName = ({
  variant = 'secondary',
  size = 'md',
}: Pick<ButtonStyle, 'variant' | 'size'> = {}): string =>
  cx(
    'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size]
  )

export function Button({
  variant,
  size,
  icon,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ComponentProps<'button'> & ButtonStyle & {readonly loading?: boolean}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(buttonClassName({variant, size}), className)}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return (
    <Link
      className={cx(buttonClassName({variant, size}), className)}
      {...props}
    >
      {icon}
      {children}
    </Link>
  )
}

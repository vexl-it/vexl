import {Children, type ComponentProps, type ReactNode} from 'react'
import {cx} from './cx'
import {EmptyState} from './EmptyState'
import {Spinner} from './Spinner'

type Align = 'left' | 'center' | 'right'

const ALIGN: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function Table({
  head,
  children,
  empty = <EmptyState title="Nothing here yet" />,
  loading = false,
}: {
  readonly head: ReactNode
  readonly children?: ReactNode
  readonly empty?: ReactNode
  readonly loading?: boolean
}) {
  const isEmpty = Children.toArray(children).length === 0

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-line bg-surface-muted">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading ? null : children}
        </tbody>
      </table>
      {loading ? (
        <div className="flex justify-center py-12 text-ink-subtle">
          <Spinner className="size-5" />
        </div>
      ) : isEmpty ? (
        empty
      ) : null}
    </div>
  )
}

export function Th({
  align = 'left',
  className,
  ...props
}: Omit<ComponentProps<'th'>, 'align'> & {readonly align?: Align}) {
  return (
    <th
      scope="col"
      className={cx(
        'whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle',
        ALIGN[align],
        className
      )}
      {...props}
    />
  )
}

export function Tr({className, ...props}: ComponentProps<'tr'>) {
  return (
    <tr
      className={cx(
        'transition-colors hover:bg-surface-muted',
        !!props.onClick && 'cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export function Td({
  align = 'left',
  className,
  ...props
}: Omit<ComponentProps<'td'>, 'align'> & {readonly align?: Align}) {
  return (
    <td
      className={cx('px-4 py-3 align-middle text-ink', ALIGN[align], className)}
      {...props}
    />
  )
}

export function TdActions({children}: {readonly children: ReactNode}) {
  return (
    <td className="px-4 py-2 align-middle">
      <div className="flex items-center justify-end gap-1">{children}</div>
    </td>
  )
}

import {type ReactNode} from 'react'
import {cx} from './cx'
import {Th} from './Table'

export interface SortState<Key extends string> {
  readonly key: Key
  readonly descending: boolean
}

/** A column header that sorts by its key and flips direction when it is active. */
export function SortTh<Key extends string>({
  sortKey,
  sort,
  onSort,
  align = 'left',
  children,
}: {
  readonly sortKey: Key
  readonly sort: SortState<Key>
  readonly onSort: (sort: SortState<Key>) => void
  readonly align?: 'left' | 'right'
  readonly children: ReactNode
}) {
  const active = sort.key === sortKey
  const direction = sort.descending ? 'descending' : 'ascending'

  return (
    <Th align={align} aria-sort={active ? direction : 'none'}>
      <button
        type="button"
        onClick={() => {
          onSort({key: sortKey, descending: active && !sort.descending})
        }}
        className={cx(
          'inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide hover:text-ink',
          active && 'text-ink'
        )}
      >
        {children}
        <span aria-hidden="true" className={cx(!active && 'opacity-30')}>
          {active && sort.descending ? '↓' : '↑'}
        </span>
      </button>
    </Th>
  )
}

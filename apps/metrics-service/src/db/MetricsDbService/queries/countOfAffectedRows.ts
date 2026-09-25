import {Option} from 'effect'

export const countOfAffectedRows = (
  row: Option.Option<{count: number}>
): number =>
  Option.match(row, {
    onNone: () => 0,
    onSome: (r) => r.count,
  })

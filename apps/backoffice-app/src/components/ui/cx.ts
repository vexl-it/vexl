import {Array, pipe, Predicate} from 'effect'

export const cx = (
  ...classes: ReadonlyArray<string | false | null | undefined>
): string => pipe(classes, Array.filter(Predicate.isString), Array.join(' '))

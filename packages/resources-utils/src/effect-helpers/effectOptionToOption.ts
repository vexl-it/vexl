import {Option} from 'effect'
import * as O from 'fp-ts/Option'

export function toFpTsOption<T>(option: Option.Option<T>): O.Option<T> {
  if (Option.isSome(option)) {
    return O.some(option.value)
  }
  return O.none
}

export function toEffectOption<T>(option: O.Option<T>): Option.Option<T> {
  if (O.isSome(option)) {
    return Option.some(option.value)
  }
  return Option.none()
}

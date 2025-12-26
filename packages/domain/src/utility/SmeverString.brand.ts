import {
  compare as compareVersions,
  validate,
  type CompareOperator,
} from 'compare-versions'
import {Schema} from 'effect'

export const SemverString = Schema.String.pipe(
  Schema.filter(validate),
  Schema.brand('SemverString')
)

export type SemverString = typeof SemverString.Type

export function compare(
  a: SemverString
): (operator: CompareOperator, b: SemverString) => boolean {
  return (operator, b) => compareVersions(a, b, operator)
}

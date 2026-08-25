import {
  compare as compareVersions,
  validate,
  type CompareOperator,
} from 'compare-versions'
import {Schema} from 'effect'

export const VersionString = Schema.String.pipe(
  Schema.filter(validate),
  Schema.brand('VersionString')
)

export type VersionString = typeof VersionString.Type

export function compare(
  a: VersionString
): (operator: CompareOperator, b: VersionString) => boolean {
  return (operator, b) => compareVersions(a, b, operator)
}

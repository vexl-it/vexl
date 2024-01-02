import {z} from 'zod'
import {
  validate,
  compare as compareVersions,
  type CompareOperator,
} from 'compare-versions'

export const SemverString = z
  .string()
  .refine(validate, 'Not a valid semver string')
  .brand<'SemverString'>()

export type SemverString = z.TypeOf<typeof SemverString>

export function compare(
  a: SemverString
): (operator: CompareOperator, b: SemverString) => boolean {
  return (operator, b) => compareVersions(a, b, operator)
}

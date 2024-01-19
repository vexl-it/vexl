import {
  compare as compareVersions,
  validate,
  type CompareOperator,
} from 'compare-versions'
import {z} from 'zod'

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

import {Schema} from '@effect/schema'
import {
  compare as compareVersions,
  validate,
  type CompareOperator,
} from 'compare-versions'
import {Brand} from 'effect'
import {z} from 'zod'

export const SemverString = z
  .string()
  .refine(validate, 'Not a valid semver string')
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'SemverString'>>()(v)
  })

export const SemverStringE = Schema.String.pipe(
  Schema.filter(validate),
  Schema.brand('SemverString')
)

export type SemverString = z.TypeOf<typeof SemverString>

export function compare(
  a: SemverString
): (operator: CompareOperator, b: SemverString) => boolean {
  return (operator, b) => compareVersions(a, b, operator)
}

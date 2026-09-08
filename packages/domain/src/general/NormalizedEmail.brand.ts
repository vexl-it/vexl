import {Schema, type Option} from 'effect'

// Deliberately loose - the goal is to skip obvious garbage, not to validate
// deliverability. Matching between two importers only needs consistency.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const NormalizedEmail = Schema.String.pipe(
  Schema.filter((v) => emailRegex.test(v)),
  Schema.brand('NormalizedEmail')
)
export type NormalizedEmail = typeof NormalizedEmail.Type

export function toNormalizedEmail(raw: string): Option.Option<NormalizedEmail> {
  return Schema.decodeUnknownOption(NormalizedEmail)(raw.trim().toLowerCase())
}

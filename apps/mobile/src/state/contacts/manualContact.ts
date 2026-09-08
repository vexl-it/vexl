import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Option} from 'effect'
import {
  type ContactKind,
  type NonUniqueContactId,
  type NormalizedContactValue,
  type StoredContactWithComputedValues,
} from './domain'
import {hashContactE} from './utils'

export function createManualContact({
  kind,
  name,
  normalizedValue,
  contactId,
  seen,
}: {
  readonly kind: ContactKind
  readonly name: string
  readonly normalizedValue: NormalizedContactValue
  readonly contactId: NonUniqueContactId
  readonly seen: boolean
}): Effect.Effect<StoredContactWithComputedValues, CryptoError> {
  return hashContactE(normalizedValue).pipe(
    Effect.map((hash) => ({
      info: {
        kind,
        name,
        label: Option.none(),
        nonUniqueContactId: Option.some(contactId),
        rawValue: normalizedValue,
      },
      computedValues: {hash, normalizedValue},
      serverHashToClient: Option.none(),
      flags: {
        seen,
        imported: false,
        importedManually: true,
        invalidNumber: 'valid' as const,
      },
    }))
  )
}

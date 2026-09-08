import {Array, Option, pipe} from 'effect'
import type {
  NormalizedContactValue,
  StoredContact,
  StoredContactWithComputedValues,
} from '../../../../state/contacts/domain'

export function findContactWithValue(
  contacts: readonly StoredContact[],
  value: NormalizedContactValue
): Option.Option<StoredContactWithComputedValues> {
  return pipe(
    contacts,
    Array.filterMap((contact) =>
      pipe(
        contact.computedValues,
        Option.filter(
          (computedValues) => computedValues.normalizedValue === value
        ),
        Option.map((computedValues) => ({...contact, computedValues}))
      )
    ),
    Array.head
  )
}

export function removeContactsWithValues({
  contacts,
  values,
}: {
  readonly contacts: readonly StoredContact[]
  readonly values: ReadonlySet<NormalizedContactValue>
}): StoredContact[] {
  return pipe(
    contacts,
    Array.filter(
      (contact) =>
        Option.isNone(contact.computedValues) ||
        !values.has(contact.computedValues.value.normalizedValue)
    )
  )
}

export function replaceSelectedValues({
  selectedValues,
  removed,
  added,
}: {
  readonly selectedValues: Set<NormalizedContactValue>
  readonly removed: readonly NormalizedContactValue[]
  readonly added: readonly NormalizedContactValue[]
}): Set<NormalizedContactValue> {
  const newSelectedValues = new Set(selectedValues)
  pipe(
    removed,
    Array.forEach((value) => newSelectedValues.delete(value))
  )
  pipe(
    added,
    Array.forEach((value) => newSelectedValues.add(value))
  )
  return newSelectedValues
}

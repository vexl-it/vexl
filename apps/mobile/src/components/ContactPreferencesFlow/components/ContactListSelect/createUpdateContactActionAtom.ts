import {Array, Effect, Option, pipe} from 'effect'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {
  needsFullContactsReplaceAfterContactEditAtom,
  storedContactsAtom,
} from '../../../../state/contacts/atom/contactsStore'
import {
  generateManualContactId,
  toStoredContact,
  type ContactKind,
  type NormalizedContactValue,
  type StoredContactWithComputedValues,
} from '../../../../state/contacts/domain'
import {createManualContact} from '../../../../state/contacts/manualContact'
import {normalizeContactValue} from '../../../../state/contacts/utils'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'
import {showContactExistsDialogAtom} from './components/showContactExistsDialogAtom'
import {
  findContactWithValue,
  removeContactsWithValues,
  replaceSelectedValues,
} from './updateContactContactHelpers'

interface UpdateContactParams {
  readonly contact: StoredContactWithComputedValues
  readonly pairedContact: StoredContactWithComputedValues | undefined
  readonly contactName: string
  readonly phoneNumber: string
  readonly email: string
}

// Editing the pair is expressed per row: a changed value is a removal of the
// old row plus an addition of a new one
type ValueChange =
  | {readonly type: 'keep'; readonly row: StoredContactWithComputedValues}
  | {readonly type: 'remove'; readonly row: StoredContactWithComputedValues}
  | {
      readonly type: 'add'
      readonly kind: ContactKind
      readonly value: NormalizedContactValue
    }

const CONTACT_KINDS: readonly ContactKind[] = ['phone', 'email']

function planValueChanges({
  kind,
  row,
  input,
}: {
  readonly kind: ContactKind
  readonly row: StoredContactWithComputedValues | undefined
  readonly input: string
}): ValueChange[] {
  if (input.trim().length === 0) {
    return row === undefined ? [] : [{type: 'remove', row}]
  }

  return pipe(
    normalizeContactValue(kind, input),
    Option.match({
      onNone: () => [],
      onSome: (value): ValueChange[] => {
        if (row === undefined) return [{type: 'add', kind, value}]
        if (row.computedValues.normalizedValue === value)
          return [{type: 'keep', row}]
        return [
          {type: 'remove', row},
          {type: 'add', kind, value},
        ]
      },
    })
  )
}

function isInvalidInput(kind: ContactKind, input: string): boolean {
  return (
    input.trim().length > 0 && Option.isNone(normalizeContactValue(kind, input))
  )
}

export function createUpdateContactActionAtom({
  reloadContacts,
  selectedValuesAtom,
}: {
  readonly reloadContacts: () => void
  readonly selectedValuesAtom: WritableAtom<
    Set<NormalizedContactValue>,
    [SetStateAction<Set<NormalizedContactValue>>],
    void
  >
}): WritableAtom<null, [UpdateContactParams], Effect.Effect<boolean>> {
  return atom(
    null,
    (get, set, params: UpdateContactParams): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const contactName = params.contactName.trim()
      const pairRows = pipe(
        [params.contact, params.pairedContact],
        Array.filter((row) => row !== undefined)
      )
      const pairValues = new Set(
        Array.map(pairRows, (row) => row.computedValues.normalizedValue)
      )
      const inputs = {phone: params.phoneNumber, email: params.email}
      const changes = pipe(
        CONTACT_KINDS,
        Array.flatMap((kind) =>
          planValueChanges({
            kind,
            row: Array.findFirst(
              pairRows,
              (row) => row.info.kind === kind
            ).pipe(Option.getOrUndefined),
            input: inputs[kind],
          })
        )
      )
      const someInputInvalid = pipe(
        CONTACT_KINDS,
        Array.some((kind) => isInvalidInput(kind, inputs[kind]))
      )
      const someValueRemains = pipe(
        changes,
        Array.some((change) => change.type !== 'remove')
      )
      const someValueChanged = pipe(
        changes,
        Array.some((change) => change.type !== 'keep')
      )

      if (contactName.length === 0 || someInputInvalid || !someValueRemains) {
        return Effect.succeed(false)
      }

      const confirmValueChanges = (): Effect.Effect<boolean> =>
        someValueChanged
          ? set(globalDialogAtom, {
              title: t('addContactDialog.replaceContactDetailsTitle'),
              subtitle: t('addContactDialog.replaceContactDetailsDescription'),
              negativeButtonText: t('common.cancel'),
              positiveButtonText: t('addContactDialog.replaceContactDetails'),
            })
          : Effect.succeed(true)

      // A value already belonging to another contact is merged into it: that
      // contact takes the new name and no row is added here
      const resolveCollisions = (): Effect.Effect<
        Option.Option<{
          readonly changes: readonly ValueChange[]
          readonly mergedInto: readonly StoredContactWithComputedValues[]
        }>
      > =>
        Effect.gen(function* (_) {
          const otherContacts = removeContactsWithValues({
            contacts: get(storedContactsAtom),
            values: pairValues,
          })
          const resolved: ValueChange[] = []
          const mergedInto: StoredContactWithComputedValues[] = []

          for (const change of changes) {
            const existing =
              change.type === 'add'
                ? findContactWithValue(otherContacts, change.value)
                : Option.none()

            if (Option.isNone(existing)) {
              resolved.push(change)
              continue
            }

            const confirmed = yield* _(
              set(showContactExistsDialogAtom, {
                existingContact: existing.value,
              })
            )
            if (!confirmed) return Option.none()
            mergedInto.push(existing.value)
          }

          return Option.some({changes: resolved, mergedInto})
        })

      const applyChanges = ({
        changes,
        mergedInto,
      }: {
        readonly changes: readonly ValueChange[]
        readonly mergedInto: readonly StoredContactWithComputedValues[]
      }): Effect.Effect<void, unknown> =>
        Effect.gen(function* (_) {
          const contactId = pipe(
            pairRows,
            Array.filterMap((row) => row.info.nonUniqueContactId),
            Array.head,
            Option.getOrElse(generateManualContactId)
          )
          const keptRows = pipe(
            changes,
            Array.filterMap((change) =>
              change.type === 'keep'
                ? Option.some({
                    ...change.row,
                    info: {
                      ...change.row.info,
                      name: contactName,
                      nonUniqueContactId: Option.some(contactId),
                    },
                  })
                : Option.none()
            )
          )
          const addedRows = yield* _(
            Effect.forEach(
              pipe(
                changes,
                Array.filterMap((change) =>
                  change.type === 'add' ? Option.some(change) : Option.none()
                )
              ),
              (change) =>
                createManualContact({
                  kind: change.kind,
                  name: contactName,
                  normalizedValue: change.value,
                  contactId,
                  seen: true,
                })
            )
          )
          const removedRows = pipe(
            changes,
            Array.filterMap((change) =>
              change.type === 'remove' ? Option.some(change.row) : Option.none()
            )
          )
          const mergedHashes = new Set(
            Array.map(mergedInto, (row) => row.computedValues.hash)
          )

          set(storedContactsAtom, (contacts) => [
            ...pipe(
              removeContactsWithValues({contacts, values: pairValues}),
              Array.map((contact) =>
                pipe(
                  contact.computedValues,
                  Option.filter((computedValues) =>
                    mergedHashes.has(computedValues.hash)
                  ),
                  Option.match({
                    onNone: () => contact,
                    onSome: () => ({
                      ...contact,
                      info: {...contact.info, name: contactName},
                    }),
                  })
                )
              )
            ),
            ...Array.map([...keptRows, ...addedRows], toStoredContact),
          ])

          if (Array.some(removedRows, (row) => row.flags.imported))
            set(needsFullContactsReplaceAfterContactEditAtom, true)

          set(selectedValuesAtom, (selectedValues) =>
            replaceSelectedValues({
              selectedValues,
              removed: Array.map(
                removedRows,
                (row) => row.computedValues.normalizedValue
              ),
              added: Array.map(
                addedRows,
                (row) => row.computedValues.normalizedValue
              ),
            })
          )
          reloadContacts()

          yield* _(
            set(globalDialogAtom, {
              title: t('addContactDialog.changesSaved'),
            }),
            Effect.asVoid
          )
        })

      return Effect.gen(function* (_) {
        const confirmed = yield* _(confirmValueChanges())
        if (!confirmed) return false

        const resolved = yield* _(resolveCollisions())
        if (Option.isNone(resolved)) return false

        yield* _(applyChanges(resolved.value))
        return true
      }).pipe(
        Effect.catchAll((e) => {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: e,
          })

          return Effect.succeed(false)
        })
      )
    }
  )
}

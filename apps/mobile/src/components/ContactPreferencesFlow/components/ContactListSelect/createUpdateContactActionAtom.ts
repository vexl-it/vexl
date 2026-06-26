import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe} from 'effect'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {
  needsFullContactsReplaceAfterContactEditAtom,
  storedContactsAtom,
} from '../../../../state/contacts/atom/contactsStore'
import {type StoredContactWithComputedValues} from '../../../../state/contacts/domain'
import {hashPhoneNumberE} from '../../../../state/contacts/utils'
import {getInternationalPhoneNumber} from '../../../../utils/getInternationalPhoneNumber'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'
import {showContactExistsDialogAtom} from './components/showContactExistsDialogAtom'
import {
  buildUpdatedContact,
  findContactWithNumber,
  removeContactsWithNumbers,
  renameComputedContact,
  replaceContactByNumber,
  replaceSelectedNumber,
} from './updateContactContactHelpers'

interface UpdateContactParams {
  readonly contact: StoredContactWithComputedValues
  readonly contactName: string
  readonly phoneNumber: string
}

export function createUpdateContactActionAtom({
  reloadContacts,
  selectedNumbersAtom,
}: {
  readonly reloadContacts: () => void
  readonly selectedNumbersAtom: WritableAtom<
    Set<E164PhoneNumber>,
    [SetStateAction<Set<E164PhoneNumber>>],
    void
  >
}): WritableAtom<null, [UpdateContactParams], Effect.Effect<boolean>> {
  return atom(
    null,
    (get, set, params: UpdateContactParams): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const normalizedNumber = toE164PhoneNumberWithDefaultCountryCode(
        params.phoneNumber
      )
      const contactName = params.contactName.trim()
      const originalNumber = params.contact.computedValues.normalizedNumber

      if (Option.isNone(normalizedNumber) || contactName.length === 0) {
        return Effect.succeed(false)
      }

      const numberChanged = normalizedNumber.value !== originalNumber

      const confirmNumberReplacement = (): Effect.Effect<boolean> =>
        numberChanged
          ? set(globalDialogAtom, {
              title: t('addContactDialog.replacePhoneNumberTitle'),
              subtitle: t('addContactDialog.replacePhoneNumberDescription', {
                oldNumber: getInternationalPhoneNumber(originalNumber),
                newNumber: getInternationalPhoneNumber(normalizedNumber.value),
              }),
              negativeButtonText: t('common.cancel'),
              positiveButtonText: t('addContactDialog.replaceNumber'),
            })
          : Effect.succeed(true)

      const markNumberReplacementForNextSubmit = (): void => {
        if (params.contact.flags.imported) {
          set(needsFullContactsReplaceAfterContactEditAtom, true)
        }
      }

      const replaceWithExistingContact = (
        existingContact: StoredContactWithComputedValues
      ): Effect.Effect<boolean, unknown> =>
        Effect.gen(function* (_) {
          const dialogResult = yield* _(
            set(showContactExistsDialogAtom, {
              existingContact,
            })
          )

          if (!dialogResult) return false

          const updatedExistingContact = renameComputedContact({
            contact: existingContact,
            contactName,
          })

          set(storedContactsAtom, (contacts) =>
            pipe(
              removeContactsWithNumbers({
                contacts,
                numbers: new Set([originalNumber, normalizedNumber.value]),
              }),
              Array.append(updatedExistingContact)
            )
          )

          markNumberReplacementForNextSubmit()
          set(selectedNumbersAtom, (selectedNumbers) =>
            replaceSelectedNumber({
              selectedNumbers,
              originalNumber,
              newNumber: normalizedNumber.value,
            })
          )
          reloadContacts()

          yield* _(
            set(globalDialogAtom, {
              title: t('addContactDialog.changesSaved'),
            }),
            Effect.asVoid
          )
          return true
        })

      const updateContact = (): Effect.Effect<boolean, unknown> =>
        Effect.gen(function* (_) {
          const confirmedReplacement = yield* _(confirmNumberReplacement())

          if (!confirmedReplacement) return false

          const hash = numberChanged
            ? yield* _(hashPhoneNumberE(normalizedNumber.value))
            : params.contact.computedValues.hash

          const updatedContact = buildUpdatedContact({
            contact: params.contact,
            contactName,
            hash,
            normalizedNumber: normalizedNumber.value,
            numberChanged,
          })

          set(storedContactsAtom, (contacts) =>
            numberChanged
              ? pipe(
                  removeContactsWithNumbers({
                    contacts,
                    numbers: new Set([originalNumber, normalizedNumber.value]),
                  }),
                  Array.append(updatedContact)
                )
              : replaceContactByNumber({
                  contacts,
                  number: originalNumber,
                  updatedContact,
                })
          )

          if (numberChanged) {
            markNumberReplacementForNextSubmit()
            set(selectedNumbersAtom, (selectedNumbers) =>
              replaceSelectedNumber({
                selectedNumbers,
                originalNumber,
                newNumber: normalizedNumber.value,
              })
            )
          }

          reloadContacts()

          yield* _(
            set(globalDialogAtom, {
              title: t('addContactDialog.changesSaved'),
            }),
            Effect.asVoid
          )

          return true
        })

      return Effect.gen(function* (_) {
        const existingContactWithNumber = numberChanged
          ? findContactWithNumber(
              get(storedContactsAtom),
              normalizedNumber.value
            )
          : Option.none()

        return yield* _(
          Option.isSome(existingContactWithNumber)
            ? replaceWithExistingContact(existingContactWithNumber.value)
            : updateContact()
        )
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

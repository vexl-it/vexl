import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe} from 'effect'
import {atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {storedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {
  type StoredContact,
  type StoredContactWithComputedValues,
} from '../../../../state/contacts/domain'
import {hashPhoneNumberE} from '../../../../state/contacts/utils'
import {getInternationalPhoneNumber} from '../../../../utils/getInternationalPhoneNumber'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'
import {showContactExistsDialogAtom} from './components/showContactExistsDialogAtom'
import {
  buildUpdatedContact,
  findImportedContactWithNumber,
  importedNumbersAfterReplacement,
  importedNumbersWithout,
  removeContactsWithNumbers,
  renameComputedContact,
  replaceContactByNumber,
  replaceSelectedNumber,
} from './updateContactContactHelpers'
import {
  saveContactToPhoneIfRequestedActionAtom,
  showContactUpdateSavedDialogActionAtom,
} from './updateContactPhoneActions'

interface UpdateContactParams {
  readonly contact: StoredContactWithComputedValues
  readonly contactName: string
  readonly phoneNumber: string
  readonly saveToPhone: boolean
}

export function createUpdateContactActionAtom({
  reloadContacts,
  selectedNumbersAtom,
}: {
  readonly reloadContacts: () => void
  readonly selectedNumbersAtom: PrimitiveAtom<Set<E164PhoneNumber>>
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
      const saveToPhoneAndShowResult = (
        saveToPhone: boolean
      ): Effect.Effect<void> =>
        pipe(
          set(saveContactToPhoneIfRequestedActionAtom, {
            name: contactName,
            number: normalizedNumber.value,
            phoneContactId: params.contact.info.nonUniqueContactId,
            saveToPhone,
          }),
          Effect.flatMap((phoneSaveResult) =>
            set(showContactUpdateSavedDialogActionAtom, phoneSaveResult)
          )
        )

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

      const submitUpdatedImportedNumbers = (
        contactsBeforeUpdate: StoredContact[]
      ): Effect.Effect<boolean> =>
        pipe(
          set(submitContactsActionAtom, {
            numbersToImport: importedNumbersAfterReplacement({
              contacts: contactsBeforeUpdate,
              newNumber: normalizedNumber.value,
              originalNumber,
            }),
            normalizeAndImportAll: false,
            showOfferReencryptionDialog: false,
          }),
          Effect.map((result) => result === 'success')
        )

      const replaceWithExistingContact = (
        existingContact: StoredContactWithComputedValues
      ): Effect.Effect<boolean, unknown> =>
        Effect.gen(function* (_) {
          const dialogResult = yield* _(
            set(showContactExistsDialogAtom, {
              existingContact,
              saveToPhone: params.saveToPhone,
            })
          )

          if (Option.isNone(dialogResult)) return false

          const contactsBeforeUpdate = get(storedContactsAtom)
          const updatedExistingContact = renameComputedContact({
            contact: existingContact,
            contactName,
          })

          set(storedContactsAtom, (contacts) =>
            replaceContactByNumber({
              contacts,
              number: normalizedNumber.value,
              updatedContact: updatedExistingContact,
            })
          )

          const submitContactsSuccess = yield* _(
            set(submitContactsActionAtom, {
              numbersToImport: importedNumbersWithout(
                contactsBeforeUpdate,
                originalNumber
              ),
              normalizeAndImportAll: false,
              showOfferReencryptionDialog: false,
            })
          )

          if (submitContactsSuccess !== 'success') {
            set(storedContactsAtom, contactsBeforeUpdate)
            return false
          }

          set(storedContactsAtom, (contacts) =>
            pipe(
              removeContactsWithNumbers({
                contacts,
                numbers: new Set([originalNumber, normalizedNumber.value]),
              }),
              Array.append(updatedExistingContact)
            )
          )

          set(selectedNumbersAtom, (selectedNumbers) =>
            replaceSelectedNumber({
              selectedNumbers,
              originalNumber,
              newNumber: normalizedNumber.value,
            })
          )
          reloadContacts()

          yield* _(saveToPhoneAndShowResult(dialogResult.value.saveToPhone))
          return true
        })

      const updateContact = (): Effect.Effect<boolean, unknown> =>
        Effect.gen(function* (_) {
          const contactsBeforeUpdate = get(storedContactsAtom)
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
                    numbers: new Set([normalizedNumber.value]),
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
            const submitContactsSuccess = yield* _(
              submitUpdatedImportedNumbers(contactsBeforeUpdate)
            )

            if (!submitContactsSuccess) {
              set(storedContactsAtom, contactsBeforeUpdate)
              return false
            }

            set(storedContactsAtom, (contacts) =>
              removeContactsWithNumbers({
                contacts,
                numbers: new Set([originalNumber]),
              })
            )
            set(selectedNumbersAtom, (selectedNumbers) =>
              replaceSelectedNumber({
                selectedNumbers,
                originalNumber,
                newNumber: normalizedNumber.value,
              })
            )
          }

          reloadContacts()

          yield* _(saveToPhoneAndShowResult(params.saveToPhone))

          return true
        })

      return Effect.gen(function* (_) {
        const existingContactWithNumber = numberChanged
          ? findImportedContactWithNumber(
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

import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  effectToTask,
  taskToEffect,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, HashSet, Ref} from 'effect'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import notEmpty from '../../../utils/notEmpty'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {syncConnectionsActionAtom} from '../../connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from '../../connections/atom/offerToConnectionsAtom'
import {type StoredContactWithComputedValues} from '../domain'
import {
  lastImportOfContactsAtom,
  normalizedContactsAtom,
  storedContactsAtom,
} from './contactsStore'
import loadContactsFromDeviceActionAtom from './loadContactsFromDeviceActionAtom'
import normalizeStoredContactsActionAtom from './normalizeStoredContactsActionAtom'

const CONTACT_IMPORT_BATCHES = 1000

export const submitContactsActionAtom = atom(
  null,
  (
    get,
    set,
    params:
      | {
          normalizeAndImportAll: true
        }
      | {normalizeAndImportAll: false; numbersToImport: E164PhoneNumber[]}
  ) => {
    const contactApi = get(apiAtom).contact
    const {t} = get(translationAtom)

    set(loadingOverlayDisplayedAtom, true)

    const normalizeStoredContacts = pipe(
      set(loadContactsFromDeviceActionAtom),
      T.chain(() => set(normalizeStoredContactsActionAtom)),
      T.map(() => undefined)
    )

    return Effect.gen(function* (_) {
      if (params.normalizeAndImportAll) {
        yield* _(normalizeStoredContacts, taskToEffect)
      }

      const allContacts = get(normalizedContactsAtom)

      const numbersToImport = !params.normalizeAndImportAll
        ? params.numbersToImport
        : allContacts.map((one) => one.computedValues.normalizedNumber)

      const contactsThatShouldBeRemovedFromImport = HashSet.fromIterable(
        allContacts.filter(
          (one) =>
            one.flags.imported &&
            !numbersToImport.includes(one.computedValues.normalizedNumber)
        )
      )

      const contactsThatShouldBeImported = numbersToImport
        .map((oneNumberToImport): StoredContactWithComputedValues | undefined =>
          allContacts.find(
            (oneContact) =>
              oneContact.computedValues.normalizedNumber === oneNumberToImport
          )
        )
        .filter(notEmpty)

      const newContactsToImport =
        // IF there are no contacts to remove, we can do an incremental import
        HashSet.size(contactsThatShouldBeRemovedFromImport) > 0
          ? contactsThatShouldBeImported
          : contactsThatShouldBeImported.filter((one) => !one.flags.imported)

      const importedNumbersSoFarRef = yield* _(
        Ref.make(HashSet.empty<E164PhoneNumber>())
      )
      yield* _(
        pipe(
          newContactsToImport,
          Array.chunksOf(CONTACT_IMPORT_BATCHES),
          Array.map((chunkToImport, i) => {
            const replace =
              i === 0 && HashSet.size(contactsThatShouldBeRemovedFromImport) > 0
            return contactApi
              .importContacts({
                body: {
                  contacts: chunkToImport.map((one) => one.computedValues.hash),
                  replace,
                },
              })
              .pipe(
                Effect.zipLeft(
                  Ref.update(
                    importedNumbersSoFarRef,
                    HashSet.union(
                      chunkToImport.map(
                        (one) => one.computedValues.normalizedNumber
                      )
                    )
                  )
                )
              )
          }),
          Effect.all,
          Effect.ensuring(
            Ref.get(importedNumbersSoFarRef).pipe(
              Effect.flatMap((importedNumbers) => {
                set(storedContactsAtom, (storedContact) =>
                  storedContact.map((oneContact) => {
                    if (!oneContact.computedValues)
                      return {
                        ...oneContact,
                        flags: {...oneContact.flags, imported: false},
                      }

                    if (
                      HashSet.has(
                        importedNumbers,
                        oneContact.computedValues.normalizedNumber
                      )
                    )
                      return {
                        ...oneContact,
                        flags: {...oneContact.flags, imported: true},
                      }
                    return {
                      ...oneContact,
                      flags: {...oneContact.flags, imported: false},
                    }
                  })
                )
                void set(syncConnectionsActionAtom)()

                void set(updateAllOffersConnectionsActionAtom, {
                  isInBackground: false,
                })()
                return Effect.void
              })
            )
          )
        )
      )

      set(
        lastImportOfContactsAtom,
        IsoDatetimeString.parse(new Date().toISOString())
      )
    }).pipe(
      Effect.tapError((e) => {
        if (e._tag === 'InitialImportContactsQuotaReachedError') {
          Alert.alert(t('contacts.initialImportContactsQuotaReachedError'))
          return Effect.void
        }
        if (e._tag === 'ImportContactsQuotaReachedError') {
          Alert.alert(t('contacts.importContactsQuotaReachedError'))
          return Effect.void
        }
        if (e._tag !== 'NetworkError') {
          reportError('error', new Error('error while submitting contacts'), {
            e,
          })
        }

        Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
        return Effect.void
      }),
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      }),
      Effect.tap(() => {
        set(loadingOverlayDisplayedAtom, false)
        return Effect.void
      }),
      effectToTask
    )
  }
)

import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  effectToTask,
  taskEitherToEffect,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, HashSet, Ref} from 'effect'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {offerProgressModalActionAtoms} from '../../../components/UploadingOfferProgressModal/atoms'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import notEmpty from '../../../utils/notEmpty'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {syncConnectionsActionAtom} from '../../connections/atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../connections/atom/offerToConnectionsAtom'
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
    params: {showOfferReencryptionDialog: boolean} & (
      | {
          normalizeAndImportAll: true
        }
      | {normalizeAndImportAll: false; numbersToImport: E164PhoneNumber[]}
    )
  ) => {
    const contactApi = get(apiAtom).contact
    const {t} = get(translationAtom)

    set(loadingOverlayDisplayedAtom, true)

    const normalizeStoredContacts = pipe(
      set(loadContactsFromDeviceActionAtom),
      TE.chainFirstTaskK(() => set(normalizeStoredContactsActionAtom))
    )

    return Effect.gen(function* (_) {
      if (params.normalizeAndImportAll) {
        yield* _(normalizeStoredContacts, taskEitherToEffect)
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

      const doIncrementalUpdate =
        // If there are no contacts to remove, we can do an incremental import
        HashSet.size(contactsThatShouldBeRemovedFromImport) === 0

      const newContactsToImport = doIncrementalUpdate
        ? contactsThatShouldBeImported.filter((one) => !one.flags.imported)
        : contactsThatShouldBeImported

      const importedNumbersSoFarRef = yield* _(
        Ref.make(HashSet.empty<E164PhoneNumber>())
      )

      if (newContactsToImport.length === 0 && !doIncrementalUpdate) {
        yield* _(
          contactApi.importContacts({
            body: {
              contacts: [],
              replace: true,
            },
          })
        )
      }

      yield* _(
        pipe(
          newContactsToImport,
          Array.chunksOf(CONTACT_IMPORT_BATCHES),
          Array.map((chunkToImport, i) => {
            const replace = i === 0 && !doIncrementalUpdate
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
              Effect.flatMap((importedNumbers) =>
                Effect.gen(function* (_) {
                  set(storedContactsAtom, (storedContacts) =>
                    storedContacts.map((oneContact) => {
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
                        flags: {
                          ...oneContact.flags,
                          // If we were doing imcremental update,
                          // Make sure to perserve the imported flag
                          // otherwise we will erase all already imported contacts
                          imported: doIncrementalUpdate
                            ? oneContact.flags.imported
                            : false,
                        },
                      }
                    })
                  )
                  if (params.showOfferReencryptionDialog) {
                    set(loadingOverlayDisplayedAtom, false)
                    set(offerProgressModalActionAtoms.show, {
                      title: t('contacts.refreshingOffers.title'),
                      bottomText: t(
                        'offerForm.offerEncryption.dontShutDownTheApp'
                      ),
                      indicateProgress: {type: 'intermediate'},
                    })

                    yield* _(
                      set(syncConnectionsActionAtom),
                      Effect.zip(
                        set(updateAndReencryptAllOffersConnectionsActionAtom, {
                          onProgres: ({offerI, totalOffers, progress}) => {
                            set(offerProgressModalActionAtoms.showStep, {
                              progress,
                              textData: {
                                title: t('contacts.refreshingOffers.title'),
                                belowProgressLeft: t(
                                  'contacts.refreshingOffers.belowProgressLeft',
                                  {
                                    i: offerI + 1,
                                    total: totalOffers,
                                  }
                                ),
                                bottomText: t(
                                  'offerForm.offerEncryption.dontShutDownTheApp'
                                ),
                              },
                            })
                          },
                          isInBackground: false,
                        })
                      )
                    )

                    yield* _(
                      set(offerProgressModalActionAtoms.hideDeffered, {
                        data: {
                          title: t('contacts.refreshingOffers.titleDone'),
                          bottomText: t(
                            'contacts.refreshingOffers.bottomTextDone'
                          ),
                          belowProgressLeft: t(
                            'contacts.refreshingOffers.belowProgressLeftDone'
                          ),
                          belowProgressRight: t('progressBar.DONE'),
                          indicateProgress: {
                            type: 'done',
                          },
                        },
                        delayMs: 3000,
                      })
                    )
                  } else {
                    yield* _(set(syncConnectionsActionAtom))
                    yield* _(
                      set(updateAndReencryptAllOffersConnectionsActionAtom, {
                        isInBackground: false,
                      })
                    )
                  }
                })
              )
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
        if (e._tag !== 'NetworkError' && e._tag !== 'PermissionsNotGranted') {
          reportError('error', new Error('error while submitting contacts'), {
            e,
          })
        }

        if (e._tag !== 'PermissionsNotGranted')
          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))

        return Effect.void
      }),
      Effect.match({
        onFailure: (e) => {
          if (e._tag === 'PermissionsNotGranted')
            return 'permissionsNotGranted' as const
          return 'otherError' as const
        },
        onSuccess: () => {
          if (
            params.normalizeAndImportAll &&
            get(normalizedContactsAtom).length === 0
          ) {
            return 'noContactsSelected' as const
          }
          return 'success' as const
        },
      }),
      Effect.tap(() => {
        set(loadingOverlayDisplayedAtom, false)
        return Effect.void
      }),
      effectToTask
    )
  }
)

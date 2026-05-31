import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  Array,
  Effect,
  HashMap,
  HashSet,
  Option,
  Ref,
  Schema,
  pipe,
} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {offerProgressModalActionAtoms} from '../../../components/UploadingOfferProgressModal/atoms'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {syncConnectionsActionAtom} from '../../connections/atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../connections/atom/offerToConnectionsAtom'
import {
  updatePersistentDataAboutNumberOfImportedContactsActionAtom,
  updatePersistentDataAboutReachActionAtom,
} from '../../connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import {areThereAnyMyOffersAtom} from '../../marketplace/atoms/myOffers'
import {type StoredContactWithComputedValues} from '../domain'
import {
  lastImportOfContactsAtom,
  normalizedContactsAtom,
  storedContactsAtom,
} from './contactsStore'
import loadContactsFromDeviceActionAtom from './loadContactsFromDeviceActionAtom'
import normalizeStoredContactsActionAtom from './normalizeStoredContactsActionAtom'

const CONTACT_IMPORT_BATCHES = 1000

type SubmitContactsActionParams = {
  readonly showOfferReencryptionDialog: boolean
  readonly manageLoadingOverlay?: boolean
} & (
  | {
      readonly normalizeAndImportAll: true
    }
  | {
      readonly normalizeAndImportAll: false
      readonly numbersToImport: E164PhoneNumber[]
    }
)

export const submitContactsActionAtom = atom(
  null,
  (
    get,
    set,
    params: SubmitContactsActionParams
  ): Effect.Effect<
    'success' | 'noContactsSelected' | 'permissionsNotGranted' | 'otherError'
  > => {
    const contactApi = get(apiAtom).contact
    const {t} = get(translationAtom)
    const manageLoadingOverlay = params.manageLoadingOverlay ?? true

    if (manageLoadingOverlay) {
      set(loadingOverlayDisplayedAtom, true)
    }

    return Effect.gen(function* (_) {
      const areThereAnyMyOffers = get(areThereAnyMyOffersAtom)

      if (params.normalizeAndImportAll) {
        yield* _(set(loadContactsFromDeviceActionAtom))
        yield* _(set(normalizeStoredContactsActionAtom))
      }

      const allContacts = get(normalizedContactsAtom)

      const numbersToImport = !params.normalizeAndImportAll
        ? params.numbersToImport
        : pipe(
            allContacts,
            Array.map((one) => one.computedValues.normalizedNumber)
          )

      const numbersToImportSet = HashSet.fromIterable(numbersToImport)

      const allContactsByNumber = pipe(
        allContacts,
        Array.reduce(
          HashMap.empty<E164PhoneNumber, StoredContactWithComputedValues>(),
          (map, contact) =>
            HashMap.set(map, contact.computedValues.normalizedNumber, contact)
        )
      )

      const contactsThatShouldBeRemovedFromImport = HashSet.fromIterable(
        pipe(
          allContacts,
          Array.filter(
            (one) =>
              one.flags.imported &&
              !HashSet.has(
                numbersToImportSet,
                one.computedValues.normalizedNumber
              )
          )
        )
      )

      const contactsThatShouldBeImported = pipe(
        numbersToImport,
        Array.filterMap((numberToImport) =>
          HashMap.get(allContactsByNumber, numberToImport)
        )
      )

      const doIncrementalUpdate =
        // If there are no contacts to remove, we can do an incremental import
        HashSet.size(contactsThatShouldBeRemovedFromImport) === 0

      const newContactsToImport = doIncrementalUpdate
        ? pipe(
            contactsThatShouldBeImported,
            Array.filter((one) => !one.flags.imported)
          )
        : contactsThatShouldBeImported

      const importedNumbersSoFarRef = yield* _(
        Ref.make(HashSet.empty<E164PhoneNumber>())
      )

      const hashedPhoneNumberToServerToClientHashRef = yield* _(
        Ref.make(HashMap.empty<HashedPhoneNumber, ServerToClientHashedNumber>())
      )

      if (newContactsToImport.length === 0 && !doIncrementalUpdate) {
        yield* _(
          contactApi.importContacts({
            contacts: [],
            replace: true,
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
                contacts: chunkToImport.map((one) => one.computedValues.hash),
                replace,
              })
              .pipe(
                Effect.tap((response) =>
                  Ref.update(hashedPhoneNumberToServerToClientHashRef, (ref) =>
                    pipe(
                      response.phoneNumberHashesToServerToClientHash,
                      Array.reduce(
                        HashMap.empty<
                          HashedPhoneNumber,
                          ServerToClientHashedNumber
                        >(),
                        (map, {hashedNumber, serverToClientHash}) =>
                          HashMap.set(map, hashedNumber, serverToClientHash)
                      ),
                      (addition) => HashMap.union(addition, ref)
                    )
                  )
                ),
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
            Effect.all({
              importedNumbers: Ref.get(importedNumbersSoFarRef),
              hashedNumbersToServerClientHash: Ref.get(
                hashedPhoneNumberToServerToClientHashRef
              ),
            }).pipe(
              Effect.flatMap(
                ({importedNumbers, hashedNumbersToServerClientHash}) =>
                  Effect.gen(function* (_) {
                    set(storedContactsAtom, (storedContacts) =>
                      storedContacts.map((oneContact) => {
                        if (!oneContact.computedValues)
                          return {
                            ...oneContact,
                            flags: {...oneContact.flags, imported: false},
                          }

                        if (
                          Option.isSome(oneContact.computedValues) &&
                          HashSet.has(
                            importedNumbers,
                            oneContact.computedValues.value.normalizedNumber
                          )
                        )
                          return {
                            ...oneContact,
                            serverHashToClient: HashMap.get(
                              hashedNumbersToServerClientHash,
                              oneContact.computedValues.value.hash
                            ),
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
                    if (
                      areThereAnyMyOffers &&
                      params.showOfferReencryptionDialog
                    ) {
                      if (manageLoadingOverlay) {
                        set(loadingOverlayDisplayedAtom, false)
                      }
                      set(offerProgressModalActionAtoms.show, {
                        title: t('contacts.refreshingOffers.title'),
                        bottomText: t(
                          'offerForm.offerEncryption.dontCloseTheApp'
                        ),
                        indicateProgress: {type: 'intermediate'},
                      })

                      yield* _(
                        set(syncConnectionsActionAtom),
                        Effect.zip(
                          set(
                            updateAndReencryptAllOffersConnectionsActionAtom,
                            {
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
                                      'offerForm.offerEncryption.dontCloseTheApp'
                                    ),
                                  },
                                })
                              },
                              isInBackground: false,
                            }
                          )
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
        Schema.decodeSync(IsoDatetimeString)(new Date().toISOString())
      )

      set(updatePersistentDataAboutNumberOfImportedContactsActionAtom)
      set(updatePersistentDataAboutReachActionAtom)
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
        if (e._tag !== 'ContactsPermissionsNotGrantedError') {
          reportError('error', new Error('error while submitting contacts'), {
            e,
          })
        }

        if (e._tag !== 'ContactsPermissionsNotGrantedError')
          Alert.alert(
            toCommonErrorMessage(e, t) ?? t('common.somethingWentWrong')
          )

        return Effect.void
      }),
      Effect.match({
        onFailure: (e): 'permissionsNotGranted' | 'otherError' => {
          if (e._tag === 'ContactsPermissionsNotGrantedError')
            return 'permissionsNotGranted'
          return 'otherError'
        },
        onSuccess: (): 'success' | 'noContactsSelected' => {
          if (
            params.normalizeAndImportAll &&
            get(normalizedContactsAtom).length === 0
          ) {
            return 'noContactsSelected'
          }
          return 'success'
        },
      }),
      Effect.tap(() => {
        if (manageLoadingOverlay) {
          set(loadingOverlayDisplayedAtom, false)
        }
        return Effect.void
      })
    )
  }
)

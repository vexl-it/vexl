import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Effect, HashMap, HashSet, Ref, Schema, pipe} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {
  offerProgressModalActionAtoms,
  type ProgressIndication,
} from '../../../components/UploadingOfferProgressModal/atoms'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import reportError from '../../../utils/reportError'
import {waitForNextAnimationFrameEffect} from '../../../utils/runAfterAnimationFrames'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {syncConnectionsActionAtom} from '../../connections/atom/connectionStateAtom'
import {updateAndReencryptAllNotesConnectionsActionAtom} from '../../connections/atom/noteToConnectionsAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../connections/atom/offerToConnectionsAtom'
import {
  updatePersistentDataAboutNumberOfImportedContactsActionAtom,
  updatePersistentDataAboutReachActionAtom,
} from '../../connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import {areThereAnyMyOffersAtom} from '../../marketplace/atoms/myOffers'
import {areThereAnyMyNotesAtom} from '../../notes/atoms/notesState'
import {type StoredContactWithComputedValues} from '../domain'
import {
  CONTACT_IMPORT_BATCH_SIZE,
  CONTACT_IMPORT_LOCAL_PROCESSING_CHUNK_SIZE,
  determineContactsImportUpdatePlan,
  percentageFromProgress,
  updateStoredContactImportState,
} from './contactImportUtils'
import {
  lastImportOfContactsAtom,
  needsFullContactsReplaceAfterContactEditAtom,
  normalizedContactsAtom,
  storedContactsAtom,
} from './contactsStore'
import loadAndNormalizeContactsFromDeviceActionAtom from './loadAndNormalizeContactsFromDeviceActionAtom'

type ContactsImportSource =
  | {
      readonly normalizeAndImportAll: true
    }
  | {
      readonly normalizeAndImportAll: false
      readonly numbersToImport: E164PhoneNumber[]
    }

type SubmitContactsActionParams = {
  readonly showOfferReencryptionDialog: boolean
  readonly manageLoadingOverlay?: boolean
  readonly showContactImportProgressDialog?: boolean
} & ContactsImportSource

type SubmitContactsResult =
  | 'success'
  | 'noContactsSelected'
  | 'permissionsNotGranted'
  | 'otherError'

interface ContactsImportUpdatePlan {
  readonly doIncrementalUpdate: boolean
  readonly newContactsToImport: readonly StoredContactWithComputedValues[]
}

interface ImportedContactsToServer {
  readonly importedNumbers: HashSet.HashSet<E164PhoneNumber>
  readonly hashedNumbersToServerClientHash: HashMap.HashMap<
    HashedPhoneNumber,
    ServerToClientHashedNumber
  >
}

interface ContactImportProgressParams {
  readonly enabled: boolean
}

const showContactImportProgressStepActionAtom = atom(
  null,
  (
    get,
    set,
    {
      enabled,
      title,
      belowProgressLeft,
      belowProgressRight,
      indicateProgress,
    }: ContactImportProgressParams & {
      readonly title: string
      readonly belowProgressLeft?: string
      readonly belowProgressRight?: string
      readonly indicateProgress: ProgressIndication
    }
  ) => {
    if (!enabled) return

    const {t} = get(translationAtom)

    set(offerProgressModalActionAtoms.show, {
      title,
      bottomText: t('contacts.importProgress.bottomTextCanTakeAWhile'),
      belowProgressLeft,
      belowProgressRight,
      indicateProgress,
    })
  }
)

const showContactImportLoaderStepActionAtom = atom(
  null,
  (
    get,
    set,
    {
      enabled,
      title,
    }: ContactImportProgressParams & {
      readonly title: string
    }
  ) => {
    set(showContactImportProgressStepActionAtom, {
      enabled,
      title,
      indicateProgress: {type: 'loader'},
    })
  }
)

const showContactImportCountProgressActionAtom = atom(
  null,
  (
    get,
    set,
    {
      enabled,
      title,
      processed,
      total,
    }: ContactImportProgressParams & {
      readonly title: string
      readonly processed: number
      readonly total: number
    }
  ) => {
    if (!enabled) return

    const {t} = get(translationAtom)
    const locale = get(formattingLocaleAtom)
    const percentage = percentageFromProgress({processed, total})

    set(showContactImportProgressStepActionAtom, {
      enabled,
      title,
      belowProgressLeft: t('contacts.importProgress.addingContactsCount', {
        imported: formatInteger(processed, locale),
        total: formatInteger(total, locale),
      }),
      belowProgressRight: t('progressBar.percentDone', {
        percentDone: formatInteger(percentage, locale),
      }),
      indicateProgress: {type: 'progress', percentage},
    })
  }
)

const waitForContactImportProgressFrameActionAtom = atom(
  null,
  (get, set, {enabled}: ContactImportProgressParams): Effect.Effect<void> => {
    return enabled ? waitForNextAnimationFrameEffect() : Effect.void
  }
)

const hideContactImportProgressActionAtom = atom(
  null,
  (get, set, {enabled}: ContactImportProgressParams) => {
    if (enabled) {
      set(offerProgressModalActionAtoms.hide)
    }
  }
)

const showContactImportProgressDoneActionAtom = atom(
  null,
  (get, set, {enabled}: ContactImportProgressParams): Effect.Effect<void> => {
    if (!enabled) return Effect.void

    const {t} = get(translationAtom)

    return set(offerProgressModalActionAtoms.hideDeffered, {
      data: {
        title: t('contacts.importProgress.titleDone'),
        bottomText: t('contacts.importProgress.bottomTextDone'),
        belowProgressLeft: t('contacts.importProgress.belowProgressLeftDone'),
        belowProgressRight: t('progressBar.DONE'),
        indicateProgress: {
          type: 'done',
        },
      },
      delayMs: 1000,
    })
  }
)

const prepareContactsForImportActionAtom = atom(
  null,
  (
    get,
    set,
    {
      normalizeAndImportAll,
      showContactImportProgressDialog,
    }: Pick<ContactsImportSource, 'normalizeAndImportAll'> & {
      readonly showContactImportProgressDialog: boolean
    }
  ) => {
    if (!normalizeAndImportAll) return Effect.void

    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      set(showContactImportLoaderStepActionAtom, {
        enabled: showContactImportProgressDialog,
        title: t('contacts.importProgress.titleReadingContacts'),
      })

      const titlePreparingContacts = t(
        'contacts.importProgress.titlePreparingContacts'
      )
      yield* _(
        set(loadAndNormalizeContactsFromDeviceActionAtom, {
          onContactsLoaded: () => {
            set(showContactImportLoaderStepActionAtom, {
              enabled: showContactImportProgressDialog,
              title: titlePreparingContacts,
            })
          },
          onNormalizationProgress: ({total, percentDone}) => {
            set(showContactImportCountProgressActionAtom, {
              enabled: showContactImportProgressDialog,
              title: titlePreparingContacts,
              processed: Math.round(total * percentDone),
              total,
            })
          },
        })
      )
    })
  }
)

const determineContactsImportUpdatePlanActionAtom = atom(
  null,
  (
    get,
    set,
    {
      contactsImportSource,
      showContactImportProgressDialog,
    }: {
      readonly contactsImportSource: ContactsImportSource
      readonly showContactImportProgressDialog: boolean
    }
  ): Effect.Effect<ContactsImportUpdatePlan> => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const allContacts = get(normalizedContactsAtom)
      const needsFullContactsReplaceAfterContactEdit = get(
        needsFullContactsReplaceAfterContactEditAtom
      )
      const numbersToImport = !contactsImportSource.normalizeAndImportAll
        ? contactsImportSource.numbersToImport
        : pipe(
            allContacts,
            Array.map((one) => one.computedValues.normalizedNumber)
          )
      const numbersToImportSet = HashSet.fromIterable(numbersToImport)
      const contactsToCheckTotal = allContacts.length + numbersToImport.length

      let checkedContactsCount = 0
      const allContactsByNumber = new Map<
        E164PhoneNumber,
        StoredContactWithComputedValues
      >()
      let someContactsShouldBeRemovedFromImport = false
      const contactsToImport: StoredContactWithComputedValues[] = []

      set(showContactImportCountProgressActionAtom, {
        enabled: showContactImportProgressDialog,
        title: t('contacts.importProgress.titleCheckingContacts'),
        processed: checkedContactsCount,
        total: contactsToCheckTotal,
      })

      for (const contactsChunk of pipe(
        allContacts,
        Array.chunksOf(CONTACT_IMPORT_LOCAL_PROCESSING_CHUNK_SIZE)
      )) {
        pipe(
          contactsChunk,
          Array.forEach((contact) => {
            allContactsByNumber.set(
              contact.computedValues.normalizedNumber,
              contact
            )
          })
        )
        someContactsShouldBeRemovedFromImport ||= pipe(
          contactsChunk,
          Array.some(
            (one) =>
              one.flags.imported &&
              !HashSet.has(
                numbersToImportSet,
                one.computedValues.normalizedNumber
              )
          )
        )
        checkedContactsCount += contactsChunk.length
        set(showContactImportCountProgressActionAtom, {
          enabled: showContactImportProgressDialog,
          title: t('contacts.importProgress.titleCheckingContacts'),
          processed: checkedContactsCount,
          total: contactsToCheckTotal,
        })
        yield* _(
          set(waitForContactImportProgressFrameActionAtom, {
            enabled: showContactImportProgressDialog,
          })
        )
      }

      for (const numbersToImportChunk of pipe(
        numbersToImport,
        Array.chunksOf(CONTACT_IMPORT_LOCAL_PROCESSING_CHUNK_SIZE)
      )) {
        pipe(
          numbersToImportChunk,
          Array.forEach((numberToImport) => {
            const contact = allContactsByNumber.get(numberToImport)
            if (contact !== undefined) contactsToImport.push(contact)
          })
        )
        checkedContactsCount += numbersToImportChunk.length
        set(showContactImportCountProgressActionAtom, {
          enabled: showContactImportProgressDialog,
          title: t('contacts.importProgress.titleCheckingContacts'),
          processed: checkedContactsCount,
          total: contactsToCheckTotal,
        })
        yield* _(
          set(waitForContactImportProgressFrameActionAtom, {
            enabled: showContactImportProgressDialog,
          })
        )
      }

      return determineContactsImportUpdatePlan({
        contactsThatShouldBeImported: contactsToImport,
        someContactsShouldBeRemovedFromImport,
        forceFullReplace: needsFullContactsReplaceAfterContactEdit,
      })
    })
  }
)

const updateStoredContactsAfterImportActionAtom = atom(
  null,
  (
    get,
    set,
    {
      doIncrementalUpdate,
      hashedNumbersToServerClientHash,
      importedNumbers,
      showContactImportProgressDialog,
    }: ImportedContactsToServer &
      Pick<ContactsImportUpdatePlan, 'doIncrementalUpdate'> & {
        readonly showContactImportProgressDialog: boolean
      }
  ) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const storedContacts = get(storedContactsAtom)
      const updatedStoredContacts: typeof storedContacts = []

      set(showContactImportLoaderStepActionAtom, {
        enabled: showContactImportProgressDialog,
        title: t('contacts.importProgress.titleUpdatingNetwork'),
      })

      for (const storedContactsChunk of pipe(
        storedContacts,
        Array.chunksOf(CONTACT_IMPORT_LOCAL_PROCESSING_CHUNK_SIZE)
      )) {
        const updatedChunk = pipe(
          storedContactsChunk,
          Array.map((contact) =>
            updateStoredContactImportState({
              contact,
              doIncrementalUpdate,
              hashedNumbersToServerClientHash,
              importedNumbers,
            })
          )
        )
        updatedStoredContacts.push(...updatedChunk)
        yield* _(
          set(waitForContactImportProgressFrameActionAtom, {
            enabled: showContactImportProgressDialog,
          })
        )
      }

      set(storedContactsAtom, updatedStoredContacts)
    })
  }
)

const importContactsAndUpdateStoredContactsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      doIncrementalUpdate,
      newContactsToImport,
      showContactImportProgressDialog,
    }: ContactsImportUpdatePlan & {
      readonly showContactImportProgressDialog: boolean
    }
  ) => {
    const contactApi = get(apiAtom).contact
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const importedNumbersSoFarRef = yield* _(
        Ref.make(HashSet.empty<E164PhoneNumber>())
      )
      const hashedPhoneNumberToServerToClientHashRef = yield* _(
        Ref.make(HashMap.empty<HashedPhoneNumber, ServerToClientHashedNumber>())
      )
      const totalContactsToImport = newContactsToImport.length

      if (totalContactsToImport === 0) {
        set(showContactImportLoaderStepActionAtom, {
          enabled: showContactImportProgressDialog,
          title: t('contacts.importProgress.titleAddingContacts'),
        })
      } else {
        set(showContactImportCountProgressActionAtom, {
          enabled: showContactImportProgressDialog,
          title: t('contacts.importProgress.titleAddingContacts'),
          processed: 0,
          total: totalContactsToImport,
        })
      }

      if (totalContactsToImport === 0 && !doIncrementalUpdate) {
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
          Array.chunksOf(CONTACT_IMPORT_BATCH_SIZE),
          Effect.forEach(
            (chunkToImport, i) => {
              const replace = i === 0 && !doIncrementalUpdate
              return contactApi
                .importContacts({
                  contacts: pipe(
                    chunkToImport,
                    Array.map((one) => one.computedValues.hash)
                  ),
                  replace,
                })
                .pipe(
                  Effect.tap((response) =>
                    Ref.update(
                      hashedPhoneNumberToServerToClientHashRef,
                      (ref) =>
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
                        pipe(
                          chunkToImport,
                          Array.map(
                            (one) => one.computedValues.normalizedNumber
                          )
                        )
                      )
                    )
                  ),
                  Effect.tap(() =>
                    Effect.sync(() => {
                      set(showContactImportCountProgressActionAtom, {
                        enabled: showContactImportProgressDialog,
                        title: t('contacts.importProgress.titleAddingContacts'),
                        processed: Math.min(
                          (i + 1) * CONTACT_IMPORT_BATCH_SIZE,
                          totalContactsToImport
                        ),
                        total: totalContactsToImport,
                      })
                    })
                  )
                )
            },
            {discard: true}
          ),
          Effect.ensuring(
            Effect.all({
              importedNumbers: Ref.get(importedNumbersSoFarRef),
              hashedNumbersToServerClientHash: Ref.get(
                hashedPhoneNumberToServerToClientHashRef
              ),
            }).pipe(
              Effect.flatMap((importedContactsData) =>
                set(updateStoredContactsAfterImportActionAtom, {
                  ...importedContactsData,
                  doIncrementalUpdate,
                  showContactImportProgressDialog,
                })
              )
            )
          )
        )
      )
    })
  }
)

const syncNetworkAfterContactsImportActionAtom = atom(
  null,
  (
    get,
    set,
    {
      manageLoadingOverlay,
      showContactImportProgressDialog,
      showOfferReencryptionDialog,
    }: {
      readonly manageLoadingOverlay: boolean
      readonly showContactImportProgressDialog: boolean
      readonly showOfferReencryptionDialog: boolean
    }
  ) => {
    const {t} = get(translationAtom)
    const areThereAnyMyOffers = get(areThereAnyMyOffersAtom)
    const areThereAnyMyNotes = get(areThereAnyMyNotesAtom)

    return Effect.gen(function* (_) {
      if (
        (areThereAnyMyOffers || areThereAnyMyNotes) &&
        showOfferReencryptionDialog
      ) {
        if (manageLoadingOverlay) {
          set(loadingOverlayDisplayedAtom, false)
        }
        set(offerProgressModalActionAtoms.show, {
          title: t('contacts.refreshingOffers.title'),
          bottomText: t(
            'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
          ),
          belowProgressLeft: t('contacts.importProgress.titleUpdatingNetwork'),
          indicateProgress: {type: 'intermediate'},
        })

        yield* _(
          set(syncConnectionsActionAtom),
          Effect.zip(
            set(updateAndReencryptAllOffersConnectionsActionAtom, {
              onProgres: ({offerI, totalOffers, progress}) => {
                set(offerProgressModalActionAtoms.showStep, {
                  aggregateProgress: {
                    processingIndex: offerI,
                    totalToProcess: totalOffers,
                  },
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
                      'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
                    ),
                  },
                })
              },
              isInBackground: false,
            })
          ),
          Effect.zipLeft(
            set(updateAndReencryptAllNotesConnectionsActionAtom, {
              onProgres: ({noteI, totalNotes, progress}) => {
                set(offerProgressModalActionAtoms.showStep, {
                  aggregateProgress: {
                    processingIndex: noteI,
                    totalToProcess: totalNotes,
                  },
                  progress,
                  textData: {
                    title: t('contacts.refreshingNotes.title'),
                    belowProgressLeft: t(
                      'contacts.refreshingNotes.belowProgressLeft',
                      {
                        i: noteI + 1,
                        total: totalNotes,
                      }
                    ),
                    bottomText: t(
                      'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
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
              bottomText: t('contacts.refreshingOffers.bottomTextDone'),
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
        set(showContactImportLoaderStepActionAtom, {
          enabled: showContactImportProgressDialog,
          title: t('contacts.importProgress.titleUpdatingNetwork'),
        })
        yield* _(set(syncConnectionsActionAtom))
        yield* _(
          set(updateAndReencryptAllOffersConnectionsActionAtom, {
            isInBackground: false,
          })
        )
        yield* _(
          set(updateAndReencryptAllNotesConnectionsActionAtom, {
            isInBackground: false,
          })
        )
        yield* _(
          set(showContactImportProgressDoneActionAtom, {
            enabled: showContactImportProgressDialog,
          })
        )
      }
    })
  }
)

export const submitContactsActionAtom = atom(
  null,
  (
    get,
    set,
    params: SubmitContactsActionParams
  ): Effect.Effect<SubmitContactsResult> => {
    const {t} = get(translationAtom)
    const showContactImportProgressDialog =
      params.showContactImportProgressDialog ?? false
    const manageLoadingOverlay =
      (params.manageLoadingOverlay ?? true) && !showContactImportProgressDialog

    if (manageLoadingOverlay) {
      set(loadingOverlayDisplayedAtom, true)
    }

    return Effect.gen(function* (_) {
      yield* _(
        set(prepareContactsForImportActionAtom, {
          normalizeAndImportAll: params.normalizeAndImportAll,
          showContactImportProgressDialog,
        })
      )

      const importUpdatePlan = yield* _(
        set(determineContactsImportUpdatePlanActionAtom, {
          contactsImportSource: params,
          showContactImportProgressDialog,
        })
      )

      yield* _(
        set(importContactsAndUpdateStoredContactsActionAtom, {
          ...importUpdatePlan,
          showContactImportProgressDialog,
        })
      )

      yield* _(
        set(syncNetworkAfterContactsImportActionAtom, {
          manageLoadingOverlay,
          showContactImportProgressDialog,
          showOfferReencryptionDialog: params.showOfferReencryptionDialog,
        })
      )

      set(
        lastImportOfContactsAtom,
        Schema.decodeSync(IsoDatetimeString)(new Date().toISOString())
      )
      set(needsFullContactsReplaceAfterContactEditAtom, false)

      set(updatePersistentDataAboutNumberOfImportedContactsActionAtom)
      set(updatePersistentDataAboutReachActionAtom)
    }).pipe(
      Effect.tapError((e) => {
        set(hideContactImportProgressActionAtom, {
          enabled: showContactImportProgressDialog,
        })

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
      Effect.ensuring(
        Effect.sync(() => {
          if (manageLoadingOverlay) {
            set(loadingOverlayDisplayedAtom, false)
          }
        })
      )
    )
  }
)

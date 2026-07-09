import {newOfferId, type OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, Option, pipe} from 'effect'
import {atom, type Atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {symmetricDifference} from 'set-operations'
import {upsertInboxOnBeAndLocallyActionAtom} from '../../../state/chat/hooks/useCreateInbox'
import {clubsWithMembersAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {importedContactsCountAtom} from '../../../state/contacts/atom/contactsStore'
import {createOfferActionAtom as createOfferFromCompleteDataActionAtom} from '../../../state/marketplace/atoms/createOfferActionAtom'
import {deleteOffersActionAtom} from '../../../state/marketplace/atoms/deleteOffersActionAtom'
import {singleOfferAtom} from '../../../state/marketplace/atoms/offersState'
import {updateOfferActionAtom} from '../../../state/marketplace/atoms/updateOfferActionAtom'
import {version} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {navigationRef} from '../../../utils/navigation'
import notEmpty from '../../../utils/notEmpty'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {
  lastUsedOfferSpokenLanguagesAtom,
  preferencesAtom,
} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {
  toCommonErrorMessage,
  type SomeError,
} from '../../../utils/useCommonErrorMessages'
import {showErrorAlert} from '../../ErrorAlert'
import {askAreYouSureActionAtom, globalDialogAtom} from '../../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {offerProgressModalActionAtoms as progressModal} from '../../UploadingOfferProgressModal/atoms'
import numberOfFriendsAtom, {
  numberOfFriendsLoadedEffect,
} from './numberOfFriendsAtom'
import {formatOfferPublicPart} from './offerFormLocationCleanup'
import {
  mergeOfferFormStateIntoPublicPart,
  offerFormStateToNewOfferPublicPart,
  type OfferFormState,
} from './offerFormState'
import {getOfferFormValidationErrorMessage} from './offerFormValidation'

export interface OfferFormPublishAtoms {
  readonly createOfferActionAtom: WritableAtom<null, [], Effect.Effect<boolean>>
  readonly editOfferActionAtom: WritableAtom<null, [], Effect.Effect<boolean>>
  readonly pauseOrResumeOfferActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<boolean>
  >
  readonly deleteOfferWithConfirmationActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<boolean>
  >
  readonly showUnpublishedChangesDialogActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<boolean>
  >
  readonly modifyOfferLoaderTitleAtom: Atom<{
    loadingText: string
    doneText: string
  }>
  readonly validateOfferFormAndShowDialogActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<boolean>
  >
}

export function createOfferFormPublishAtoms({
  workingFormAtom,
  committedFormAtom,
  editedOfferIdAtom,
  offerActiveAtom,
  checkAmountExceedsLimitAndShowDialogActionAtom,
  discardChangesActionAtom,
}: {
  workingFormAtom: PrimitiveAtom<OfferFormState>
  committedFormAtom: PrimitiveAtom<OfferFormState>
  editedOfferIdAtom: PrimitiveAtom<OfferId | undefined>
  offerActiveAtom: PrimitiveAtom<boolean>
  checkAmountExceedsLimitAndShowDialogActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<boolean>
  >
  discardChangesActionAtom: WritableAtom<null, [], void>
}): OfferFormPublishAtoms {
  const modifyOfferLoaderTitleAtom = atom((get) => {
    const {t} = get(translationAtom)
    const locale = get(formattingLocaleAtom)
    const numberOfFriends = get(numberOfFriendsAtom)
    // TODO: this value is from state and may not be 100% accurate
    // as we are fetching connections when encrypting offer once more
    const {intendedConnectionLevel, selectedClubsUuids} = get(
      get(editedOfferIdAtom) ? committedFormAtom : workingFormAtom
    )
    const offerEncryptedAlsoForClubs = Array.length(selectedClubsUuids) > 0
    const clubsMembersCount = pipe(
      get(clubsWithMembersAtom),
      Array.filterMap((club) =>
        Array.contains(club.club.uuid)(selectedClubsUuids)
          ? Option.some(club.members)
          : Option.none()
      ),
      Array.flatten,
      Array.length
    )

    if (numberOfFriends.state === 'error') {
      return {
        loadingText: t('offerForm.noVexlersFoundForYourOffer'),
        doneText: t('offerForm.noVexlersFoundForYourOffer'),
      }
    }

    if (numberOfFriends.state === 'loading') {
      return {
        loadingText: t('offerForm.loadingNumberOfVexlaks'),
        doneText: t('offerForm.loadingVexlaksDone'),
      }
    }

    const friendsCount =
      intendedConnectionLevel === 'FIRST'
        ? !offerEncryptedAlsoForClubs
          ? numberOfFriends.firstLevelFriendsCount
          : numberOfFriends.firstLevelFriendsCount + clubsMembersCount
        : !offerEncryptedAlsoForClubs
          ? numberOfFriends.firstAndSecondLevelFriendsCount
          : numberOfFriends.firstAndSecondLevelFriendsCount + clubsMembersCount

    return {
      loadingText: t('offerForm.offerEncryption.forPeopleFormatted', {
        localizedString: formatInteger(friendsCount, locale),
      }),
      doneText: t(
        'offerForm.offerEncryption.anonymouslyDeliveredToPeopleFormatted',
        {
          localizedString: formatInteger(friendsCount, locale),
        }
      ),
    }
  })

  const validateOfferFormAndShowDialogActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)

      const errorMessage = getOfferFormValidationErrorMessage(
        get(workingFormAtom),
        t
      )
      if (errorMessage) {
        return Effect.as(
          set(globalDialogAtom, {
            title: t('offerForm.errorCreatingOffer'),
            subtitle: errorMessage,
            positiveButtonText: t('common.close'),
          }),
          false
        )
      }

      return set(checkAmountExceedsLimitAndShowDialogActionAtom)
    }
  )

  const createOfferActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const importedContactsCount = get(importedContactsCountAtom)

      return Effect.gen(function* (_) {
        const valid = yield* _(set(validateOfferFormAndShowDialogActionAtom))
        if (!valid) return false

        const form = get(workingFormAtom)
        const {goldenAvatarType} = get(preferencesAtom)

        const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

        yield* _(set(checkNotificationPermissionsAndAskIfPossibleActionAtom))

        set(progressModal.show, {
          title: t('offerForm.offerEncryption.encryptingYourOffer'),
          belowProgressLeft: belowProgressLeft.loadingText,
          bottomText: t(
            'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
          ),
          indicateProgress: {type: 'intermediate'},
        })

        const offerId = newOfferId()
        const {inbox} = yield* _(
          set(upsertInboxOnBeAndLocallyActionAtom, {
            for: 'myOffer',
            offerId,
          })
        )

        yield* _(numberOfFriendsLoadedEffect)

        const payloadPublic = formatOfferPublicPart(
          offerFormStateToNewOfferPublicPart({
            state: form,
            offerPublicKey: inbox.privateKey.publicKeyPemBase64,
          })
        )

        yield* _(
          set(createOfferFromCompleteDataActionAtom, {
            offerId,
            payloadPublic: {
              ...payloadPublic,
              authorClientVersion: version,
              goldenAvatarType,
            },

            intendedConnectionLevel: form.intendedConnectionLevel,
            intendedClubs: [...form.selectedClubsUuids],
            onProgress: (progress) => {
              set(progressModal.showStep, {
                progress,
                textData: {
                  title: t('offerForm.offerEncryption.encryptingYourOffer'),
                  belowProgressLeft: belowProgressLeft.loadingText,
                  bottomText: t(
                    'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
                  ),
                },
              })
            },
            offerKey: inbox.privateKey,
          })
        )

        yield* _(
          set(progressModal.hideDeffered, {
            data: {
              title: t('offerForm.offerEncryption.doneOfferPoster'),
              bottomText: t(
                'offerForm.offerEncryption.yourFriendsAndFriendsOfFriends'
              ),
              belowProgressLeft: belowProgressLeft.doneText,
              belowProgressRight: t('progressBar.DONE'),
              indicateProgress: {type: 'progress', percentage: 100},
            },
            delayMs: 3000,
          })
        )

        set(lastUsedOfferSpokenLanguagesAtom, [...form.spokenLanguages])

        return true
      }).pipe(
        Effect.catchAll((e) => {
          set(progressModal.hide)

          if (e._tag === 'NotificationPrompted') return Effect.succeed(false)

          if (
            e._tag === 'PrivatePayloadsConstructionError' &&
            importedContactsCount === 0
          ) {
            return Effect.zipRight(
              set(askAreYouSureActionAtom, {
                variant: 'danger',
                steps: [
                  {
                    type: 'StepWithText',
                    title: t('offerForm.errorCreatingOffer'),
                    description: t('offerForm.seemsYouHaveReachNoVexlers'),
                    positiveButtonText: t('common.close'),
                  },
                ],
              }).pipe(Effect.ignore),
              Effect.succeed(false)
            )
          }

          if (e._tag === 'PrivatePayloadsConstructionError') {
            return Effect.zipRight(
              set(askAreYouSureActionAtom, {
                variant: 'danger',
                steps: [
                  {
                    type: 'StepWithText',
                    title: t('offerForm.errorCreatingOffer'),
                    description: t(
                      'offerForm.youCurrentlyHaveNoConnectionsForSelectedFriendLevel'
                    ),
                    positiveButtonText: t('postLoginFlow.importContactsButton'),
                    negativeButtonText: t('clubs.joinNewClub'),
                  },
                ],
              }).pipe(
                Effect.match({
                  onSuccess() {
                    if (navigationRef.isReady()) {
                      navigationRef.reset({
                        index: 0,
                        routes: [
                          {
                            name: 'ContactPreferences',
                          },
                        ],
                      })
                    }
                  },
                  onFailure(error) {
                    if (error._tag === 'UserDeclinedError') {
                      if (navigationRef.isReady()) {
                        navigationRef.navigate('InsideTabs', {
                          screen: 'Community',
                          params: {screen: 'Clubs'},
                        })
                      }
                    } else {
                      reportError(
                        'error',
                        new Error('Error in offer creation'),
                        {
                          error,
                        }
                      )
                    }
                  },
                })
              ),
              Effect.succeed(false)
            )
          }

          reportError('error', new Error('Error while creating offer'), {e})

          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('offerForm.errorCreatingOffer'),
            error: e,
          })

          return Effect.succeed(false)
        })
      )
    }
  )

  const editOfferActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)

    const mainEffect = Effect.gen(function* (_) {
      const offer = get(singleOfferAtom(get(editedOfferIdAtom)))
      const committed = get(committedFormAtom)

      // this should never happen as we are setting the form from existing offer
      if (!offer?.ownershipInfo) {
        return yield* _(
          Effect.fail({
            _tag: 'NotFoundError' as const,
          } satisfies SomeError)
        )
      }

      const targetRecipientsHasChanged =
        committed.intendedConnectionLevel !==
          offer.ownershipInfo.intendedConnectionLevel ||
        symmetricDifference(
          committed.selectedClubsUuids,
          offer.ownershipInfo.intendedClubs
        ).length > 0

      const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

      set(progressModal.show, {
        title: t('editOffer.editingYourOffer'),
        bottomText: t('editOffer.pleaseWait'),
        belowProgressLeft: belowProgressLeft.loadingText,
        indicateProgress: {type: 'intermediate'},
      })

      yield* _(numberOfFriendsLoadedEffect)
      const payloadPublic = formatOfferPublicPart(
        mergeOfferFormStateIntoPublicPart(committed, offer.offerInfo.publicPart)
      )

      yield* _(
        set(updateOfferActionAtom, {
          payloadPublic: {
            ...payloadPublic,
            active: true,
          },
          adminId: offer.ownershipInfo.adminId,
          symmetricKey: offer.offerInfo.privatePart.symmetricKey,
          intendedConnectionLevel: committed.intendedConnectionLevel,
          intendedClubs: [...committed.selectedClubsUuids],
          updatePrivateParts: targetRecipientsHasChanged,
          onProgress: (progress) => {
            set(progressModal.showStep, {
              progress,
              textData: {
                title: t('offerForm.offerEncryption.encryptingYourOffer'),
                belowProgressLeft: belowProgressLeft.loadingText,
                bottomText: t(
                  'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
                ),
              },
            })
          },
        })
      )

      yield* _(
        set(progressModal.hideDeffered, {
          data: {
            title: t('editOffer.offerEditSuccess'),
            bottomText: t('editOffer.youCanCheckYourOffer'),
            belowProgressLeft: belowProgressLeft.doneText,
            indicateProgress: {type: 'done'},
          },
          delayMs: 2000,
        })
      )
    }).pipe(
      Effect.match({
        onSuccess: () => true,
        onFailure: (e) => {
          set(progressModal.hide)

          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('editOffer.errorEditingOffer'),
            error: e,
          })

          return false
        },
      })
    )

    return Effect.gen(function* (_) {
      const valid = yield* _(set(validateOfferFormAndShowDialogActionAtom))
      if (!valid) return false
      return yield* _(mainEffect)
    })
  })

  const toggleOfferActiveAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const offer = get(singleOfferAtom(get(editedOfferIdAtom)))
      if (!offer?.ownershipInfo) return false

      const targetValue = !get(offerActiveAtom)
      set(offerActiveAtom, targetValue)

      const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

      set(progressModal.show, {
        title: t('editOffer.editingYourOffer'),
        bottomText: t('editOffer.pleaseWait'),
        belowProgressLeft: targetValue
          ? belowProgressLeft.loadingText
          : t('editOffer.pausingOfferProgress'),
        indicateProgress: {type: 'intermediate'},
      })

      yield* _(
        set(updateOfferActionAtom, {
          payloadPublic: {
            ...offer.offerInfo.publicPart,
            active: targetValue,
          },
          adminId: offer.ownershipInfo.adminId,
          symmetricKey: offer.offerInfo.privatePart.symmetricKey,
          intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
          intendedClubs: offer.ownershipInfo.intendedClubs,
          ...(offer.offerInfo.privatePart.intendedClubs && {
            intendedClubs: [...offer.offerInfo.privatePart.intendedClubs],
          }),
          updatePrivateParts: false,
        })
      )

      yield* _(
        set(progressModal.hideDeffered, {
          data: {
            title: !targetValue
              ? t('editOffer.pausingOfferSuccess')
              : t('editOffer.offerEditSuccess'),
            bottomText: t('editOffer.youCanCheckYourOffer'),
            belowProgressLeft: targetValue
              ? belowProgressLeft.doneText
              : t('editOffer.offerEditSuccess'),
            indicateProgress: {type: 'done'},
          },
          delayMs: 1500,
        })
      )

      return true
    }).pipe(
      Effect.match({
        onSuccess: (result) => result,
        onFailure: (e) => {
          set(offerActiveAtom, !get(offerActiveAtom))
          set(progressModal.hide)
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ??
              t('editOffer.offerUnableToChangeOfferActivation'),
            error: e,
          })

          return false
        },
      })
    )
  })

  const pauseOrResumeOfferActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      if (get(offerActiveAtom)) {
        const confirmed = yield* _(
          set(globalDialogAtom, {
            title: t('editOffer.pauseOfferTitle'),
            subtitle: t('editOffer.pauseOfferDescription'),
            positiveButtonText: t('editOffer.yesPause'),
            negativeButtonText: t('common.cancel'),
          })
        )
        if (!confirmed) return false
      }
      return yield* _(set(toggleOfferActiveAtom))
    })
  })

  const deleteOfferWithConfirmationActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)
    const offer = get(singleOfferAtom(get(editedOfferIdAtom)))

    return Effect.gen(function* (_) {
      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('editOffer.deleteOffer'),
          subtitle: t('editOffer.deleteOfferDescriptionShort'),
          positiveButtonText: t('common.yesDelete'),
          positiveButtonVariant: 'destructive',
          negativeButtonText: t('common.cancel'),
        })
      )
      if (!confirmed) return false

      set(loadingOverlayDisplayedAtom, true)

      yield* _(
        set(deleteOffersActionAtom, {
          adminIds: [offer?.ownershipInfo?.adminId].filter(notEmpty),
        })
      )

      set(loadingOverlayDisplayedAtom, false)

      return true
    }).pipe(
      Effect.catchAll((e) => {
        set(loadingOverlayDisplayedAtom, false)
        showErrorAlert({
          title:
            toCommonErrorMessage(e, t) ?? t('editOffer.errorDeletingOffer'),
          error: e,
        })

        return Effect.succeed(false)
      })
    )
  })

  const showUnpublishedChangesDialogActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)

      return Effect.gen(function* (_) {
        const confirmed = yield* _(
          set(globalDialogAtom, {
            title: t('editOffer.unpublishedChangesTitle'),
            subtitle: t('editOffer.unpublishedChangesDescription'),
            positiveButtonText: t('editOffer.publish'),
            negativeButtonText: t('editOffer.discard'),
            disableClose: true,
          })
        )

        if (!confirmed) {
          set(discardChangesActionAtom)
          return true
        }

        return yield* _(set(editOfferActionAtom))
      })
    }
  )

  return {
    createOfferActionAtom,
    editOfferActionAtom,
    pauseOrResumeOfferActionAtom,
    deleteOfferWithConfirmationActionAtom,
    showUnpublishedChangesDialogActionAtom,
    modifyOfferLoaderTitleAtom,
    validateOfferFormAndShowDialogActionAtom,
  }
}

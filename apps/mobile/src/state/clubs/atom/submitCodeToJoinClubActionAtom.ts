import {type ClubCode, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type MyOfferInState,
  type OfferAdminId,
} from '@vexl-next/domain/src/general/offers'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {eitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Option, pipe, Struct} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {clubToJoinAtom} from '../../../components/JoinClubFlow/atoms'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {offerProgressModalActionAtoms} from '../../../components/UploadingOfferProgressModal/atoms'
import {
  translationAtom,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {myActiveOffersAtom} from '../../marketplace/atoms/myOffers'
import {updateOfferActionAtom} from '../../marketplace/atoms/updateOfferActionAtom'
import {generateVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {SelectOffersToPublishToClubComponent} from './SelectOffersToPublishToClubComponent'
import {clubsToKeyHolderAtom} from './clubsToKeyHolderV2Atom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from './refreshClubsActionAtom'

interface SubmitCodeToJoinClubOptions {
  readonly code: ClubCode
  readonly onCodeNotFound?: () => void
  readonly skipConfirmation?: boolean
}

type SubmitCodeToJoinClubInput = ClubCode | SubmitCodeToJoinClubOptions

interface PublishOfferSuccess {
  readonly _tag: 'Success'
  readonly offer: MyOfferInState
}

interface PublishOfferFailure {
  readonly _tag: 'Failure'
  readonly offer: MyOfferInState
}

type PublishOfferResult = PublishOfferSuccess | PublishOfferFailure

function getCodeFromInput(input: SubmitCodeToJoinClubInput): ClubCode {
  return typeof input === 'string' ? input : input.code
}

function publishOfferSuccess(offer: MyOfferInState): PublishOfferResult {
  return {
    _tag: 'Success',
    offer,
  }
}

function publishOfferFailure(offer: MyOfferInState): PublishOfferResult {
  return {
    _tag: 'Failure',
    offer,
  }
}

function getFailedOffers(
  publishResults: readonly PublishOfferResult[]
): readonly MyOfferInState[] {
  return pipe(
    publishResults,
    Array.filter((result) => result._tag === 'Failure'),
    Array.map((result) => result.offer)
  )
}

function getPublishedOffersCountKey(
  publishedCount: number
):
  | 'clubs.publishOffersToJoinedClub.successCount_one'
  | 'clubs.publishOffersToJoinedClub.successCount_other' {
  return publishedCount === 1
    ? 'clubs.publishOffersToJoinedClub.successCount_one'
    : 'clubs.publishOffersToJoinedClub.successCount_other'
}

function appendClubUuidToIntendedClubs(
  offer: MyOfferInState,
  clubUuid: ClubUuid
): readonly ClubUuid[] {
  return pipe(
    offer.ownershipInfo.intendedClubs ?? [],
    Array.append(clubUuid),
    Array.dedupe
  )
}

function getJoinedClubSuccessSubtitle({
  isModerator,
  t,
}: {
  readonly isModerator: boolean
  readonly t: TFunction
}): string {
  if (!isModerator) return t('clubs.nowYouWillSeeOffersFromClubMembers')

  return `${t('clubs.nowYouWillSeeOffersFromClubMembers')} ${t(
    'clubs.youJoinedAsModerator'
  )}`
}

const publishSelectedOffersToJoinedClubActionAtom = atom(
  null,
  (
    get,
    set,
    {
      clubName,
      clubUuid,
      isModerator,
    }: {
      clubName: string
      clubUuid: ClubUuid
      isModerator: boolean
    }
  ): Effect.Effect<void> => {
    const {t} = get(translationAtom)
    const locale = get(formattingLocaleAtom)
    const offersAvailableToPublish = pipe(
      get(myActiveOffersAtom),
      Array.filter(
        (offer) =>
          !Array.contains(offer.ownershipInfo.intendedClubs ?? [], clubUuid)
      )
    )

    if (!Array.isNonEmptyReadonlyArray(offersAvailableToPublish)) {
      return set(globalDialogAtom, {
        title: t('clubs.clubJoinedSuccessfully'),
        subtitle: getJoinedClubSuccessSubtitle({isModerator, t}),
        positiveButtonText: t('common.ok'),
      }).pipe(Effect.asVoid)
    }

    const selectedOfferAdminIdsAtom = atom<readonly OfferAdminId[]>([])
    const publishButtonDisabledAtom = atom(
      (get) => !Array.isNonEmptyReadonlyArray(get(selectedOfferAdminIdsAtom))
    )

    return Effect.gen(function* (_) {
      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('clubs.publishOffersToJoinedClub.title', {clubName}),
          subtitle: getJoinedClubSuccessSubtitle({isModerator, t}),
          children: React.createElement(SelectOffersToPublishToClubComponent, {
            offers: offersAvailableToPublish,
            selectedOfferAdminIdsAtom,
          }),
          negativeButtonText: t('common.notNow'),
          positiveButtonText: t('clubs.publishOffersToJoinedClub.action'),
          positiveButtonDisabledAtom: publishButtonDisabledAtom,
        })
      )

      if (!confirmed) return

      const selectedOfferAdminIds = get(selectedOfferAdminIdsAtom)
      const selectedOffers = pipe(
        offersAvailableToPublish,
        Array.filter((offer) =>
          Array.contains(selectedOfferAdminIds, offer.ownershipInfo.adminId)
        )
      )

      if (!Array.isNonEmptyReadonlyArray(selectedOffers)) return

      const publishOffers = (
        offersToPublish: readonly MyOfferInState[]
      ): Effect.Effect<void> => {
        if (!Array.isNonEmptyReadonlyArray(offersToPublish)) return Effect.void

        return Effect.gen(function* (_) {
          const totalToProcess = Array.length(offersToPublish)
          const formattedTotalToProcess = formatInteger(totalToProcess, locale)

          set(offerProgressModalActionAtoms.show, {
            title: t('clubs.publishOffersToJoinedClub.progressTitle'),
            bottomText: t(
              'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
            ),
            belowProgressLeft: t(
              'clubs.publishOffersToJoinedClub.progressStatus',
              {
                processingIndex: formatInteger(1, locale),
                totalToProcess: formattedTotalToProcess,
              }
            ),
            indicateProgress: {type: 'intermediate'},
          })

          const publishResults = yield* _(
            Effect.forEach(
              offersToPublish,
              (offer, index) =>
                set(updateOfferActionAtom, {
                  payloadPublic: offer.offerInfo.publicPart,
                  symmetricKey: offer.offerInfo.privatePart.symmetricKey,
                  adminId: offer.ownershipInfo.adminId,
                  intendedConnectionLevel:
                    offer.ownershipInfo.intendedConnectionLevel,
                  intendedClubs: appendClubUuidToIntendedClubs(offer, clubUuid),
                  updatePrivateParts: true,
                  updateLocalStateAfterPrivateParts: true,
                  onProgress: (progress) => {
                    set(offerProgressModalActionAtoms.showStep, {
                      progress,
                      textData: {
                        title: t(
                          'clubs.publishOffersToJoinedClub.progressTitle'
                        ),
                        bottomText: t(
                          'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
                        ),
                        belowProgressLeft: t(
                          'clubs.publishOffersToJoinedClub.progressStatus',
                          {
                            processingIndex: formatInteger(index + 1, locale),
                            totalToProcess: formattedTotalToProcess,
                          }
                        ),
                      },
                    })
                  },
                }).pipe(
                  Effect.as(publishOfferSuccess(offer)),
                  Effect.catchAll(() =>
                    Effect.succeed(publishOfferFailure(offer))
                  )
                ),
              {concurrency: 1}
            )
          )

          const failedOffers = getFailedOffers(publishResults)

          if (Array.isNonEmptyReadonlyArray(failedOffers)) {
            set(offerProgressModalActionAtoms.hide)

            const retryFailedOffers = yield* _(
              set(globalDialogAtom, {
                title: t('clubs.publishOffersToJoinedClub.partialErrorTitle'),
                subtitle: t(
                  'clubs.publishOffersToJoinedClub.partialErrorDescription'
                ),
                negativeButtonText: t('common.notNow'),
                positiveButtonText: t(
                  'clubs.publishOffersToJoinedClub.retryFailedAction'
                ),
              })
            )

            if (retryFailedOffers) {
              yield* _(publishOffers(failedOffers))
            }

            return
          }

          yield* _(
            set(offerProgressModalActionAtoms.hideDeffered, {
              data: {
                title: t('clubs.publishOffersToJoinedClub.successTitle'),
                bottomText: t(
                  'clubs.publishOffersToJoinedClub.successDescription',
                  {
                    clubName,
                  }
                ),
                belowProgressLeft: t(
                  getPublishedOffersCountKey(totalToProcess),
                  {
                    publishedCount: formattedTotalToProcess,
                  }
                ),
                indicateProgress: {type: 'done'},
              },
              delayMs: 2000,
            })
          )
        })
      }

      yield* _(publishOffers(selectedOffers))
    }).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          set(offerProgressModalActionAtoms.hide)
          showErrorAlert({
            title: t('clubs.publishOffersToJoinedClub.errorTitle'),
            description: t('common.somethingWentWrongDescription'),
            error,
          })
        })
      )
    )
  }
)

export const submitCodeToJoinClubActionAtom = atom(
  null,
  (get, set, input: SubmitCodeToJoinClubInput) => {
    const {t} = get(translationAtom)
    const api = get(apiAtom)
    const code = getCodeFromInput(input)

    return Effect.gen(function* (_) {
      const newKeypair = yield* _(eitherToEffect(generateKeyPair()))
      const newKeypairV2 = yield* _(generateV2KeyPair())
      const notificationToken = yield* _(
        getNotificationTokenE(),
        Effect.map(Option.fromNullable)
      )

      const club = yield* _(
        api.contact.getClubInfoByAccessCode({
          code,
          keyPair: newKeypair,
          keyPairV2: newKeypairV2,
        })
      )

      if (typeof input === 'string' || !input.skipConfirmation) {
        const confirmed = yield* _(
          set(globalDialogAtom, {
            title: t('clubs.wannaStepInsideOfClub', {
              clubName: club.club.name,
            }),
            subtitle: t(
              club.isModerator
                ? 'clubs.joiningClubGivesYouAccessAsModerator'
                : 'clubs.joiningClubGivesYouAccess',
              {
                clubName: club.club.name,
              }
            ),
            negativeButtonText: t('common.cancel'),
            positiveButtonText: t('common.continue'),
          })
        )

        if (!confirmed) return false
      }

      set(loadingOverlayDisplayedAtom, true)

      const myStoredClubs = get(clubsToKeyHolderAtom)
      const oldKeyPair = newKeypair
      const clubKeys = {
        keyPair: newKeypairV2,
        oldKeyPair,
      }

      if (myStoredClubs[club.club.uuid]) {
        yield* _(Effect.fail(new MemberAlreadyInClubError()))
      }

      set(clubsToKeyHolderAtom, (prevState) => ({
        ...prevState,
        [club.club.uuid]: clubKeys,
      }))

      const vexlNotificationToken = yield* _(set(generateVexlTokenActionAtom))

      const {clubInfoForUser} = yield* _(
        api.contact
          .joinClub({
            keyPair: oldKeyPair,
            code,
            contactsImported: true,
            notificationToken,
            vexlNotificationToken: Option.some(vexlNotificationToken),
            keyPairV2: newKeypairV2,
          })
          .pipe(
            Effect.tapError(() =>
              Effect.sync(() => {
                set(clubsToKeyHolderAtom, Struct.omit(club.club.uuid))
              })
            )
          )
      )

      yield* _(
        set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
          clubUuid: clubInfoForUser.club.uuid,
        })
      )

      set(loadingOverlayDisplayedAtom, false)

      yield* _(
        set(publishSelectedOffersToJoinedClubActionAtom, {
          clubName: clubInfoForUser.club.name,
          clubUuid: clubInfoForUser.club.uuid,
          isModerator: club.isModerator,
        })
      )

      return true
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(loadingOverlayDisplayedAtom, false)
        })
      ),
      Effect.catchAll((e) => {
        const onCodeNotFound =
          typeof input === 'string' ? undefined : input.onCodeNotFound

        if (e._tag === 'NotFoundError' && onCodeNotFound) {
          return Effect.sync(() => {
            onCodeNotFound()
            return false
          })
        }

        if (
          e._tag === 'ClubUserLimitExceededError' ||
          e._tag === 'MemberAlreadyInClubError' ||
          e._tag === 'NotFoundError'
        ) {
          const description = (() => {
            if (e._tag === 'ClubUserLimitExceededError')
              return t('clubs.clubIsFullDescription')
            if (e._tag === 'MemberAlreadyInClubError')
              return t('clubs.youAreAlreadyMemberOfThisClubDescription')
            if (e._tag === 'NotFoundError')
              return t('clubs.accessDeniedCodeIsInvalid')
            return t('common.somethingWentWrong')
          })()

          return Effect.zipRight(
            set(globalDialogAtom, {
              title: t('clubs.joiningUnsucessful'),
              subtitle: description,
              positiveButtonText: t('common.close'),
              positiveButtonVariant: 'destructive',
            }),
            Effect.succeed(false)
          )
        }

        // RequestError (offline) is excluded on purpose - it's a user-side
        // condition, not an app fault, so we don't report it to Sentry.
        // toCommonErrorMessage maps it to the network-error message below.
        if (
          e._tag === 'InvalidChallengeError' ||
          e._tag === 'HttpApiDecodeError' ||
          e._tag === 'ResponseError' ||
          e._tag === 'UnexpectedServerError' ||
          e._tag === 'CryptoError'
        ) {
          reportError('error', new Error('Join club error'), {e})
        }

        showErrorAlert({
          title: t('common.somethingWentWrong'),
          description:
            toCommonErrorMessage(e, t) ??
            t('common.somethingWentWrongDescription'),
          error: e,
        })

        return Effect.succeed(false)
      })
    )
  }
)

export const validateCodeToJoinClubActionAtom = atom(
  null,
  (get, set, input: SubmitCodeToJoinClubOptions) => {
    const {t} = get(translationAtom)
    const api = get(apiAtom)

    return Effect.gen(function* (_) {
      const newKeypair = yield* _(eitherToEffect(generateKeyPair()))
      const newKeypairV2 = yield* _(generateV2KeyPair())

      const club = yield* _(
        api.contact.getClubInfoByAccessCode({
          code: input.code,
          keyPair: newKeypair,
          keyPairV2: newKeypairV2,
        })
      )
      yield* _(
        Effect.sync(() => {
          set(clubToJoinAtom, {
            club: club.club,
            isModerator: club.isModerator,
          })
        })
      )

      return true
    }).pipe(
      Effect.catchAll((e) => {
        if (e._tag === 'NotFoundError') {
          return Effect.sync(() => {
            input.onCodeNotFound?.()
            return false
          })
        }

        // RequestError (offline) is excluded on purpose - it's a user-side
        // condition, not an app fault, so we don't report it to Sentry.
        // toCommonErrorMessage maps it to the network-error message below.
        if (
          e._tag === 'InvalidChallengeError' ||
          e._tag === 'HttpApiDecodeError' ||
          e._tag === 'ResponseError' ||
          e._tag === 'UnexpectedServerError' ||
          e._tag === 'CryptoError'
        ) {
          reportError('error', new Error('Validate join club code error'), {
            e,
          })
        }

        showErrorAlert({
          title: t('common.somethingWentWrong'),
          description:
            toCommonErrorMessage(e, t) ??
            t('common.somethingWentWrongDescription'),
          error: e,
        })

        return Effect.succeed(false)
      })
    )
  }
)

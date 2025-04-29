import {
  type OfferInfo,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, Either, Option, Record} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../api'
import {clubsToKeyHolderAtom} from '../../state/clubs/atom/clubsToKeyHolderAtom'
import {createSingleOfferReportedFlagAtom} from '../../state/marketplace/atoms/offersState'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import showErrorAlert from '../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'

export const showCommonFriendsExplanationActionAtom = atom(
  null,
  (get, set, offerInfo: OfferInfo) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const modalContent = (() => {
        if (offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE')) {
          if (offerInfo.privatePart.commonFriends.length === 0) {
            return {
              title: t('offer.offerFromDirectFriend'),
              description: `${t('offer.youSeeThisOfferBecause')} ${t(
                'offer.beCautiousWeCannotVerify'
              )}`,
              positiveButtonText: t('common.gotIt'),
            }
          }
          return {
            title: t('offer.offerFromDirectFriend'),
            description: `${t('offer.youSeeThisOfferBecause')} ${t(
              'offer.dontForgetToVerifyTheIdentity'
            )}`,
            positiveButtonText: t('common.gotIt'),
          }
        }
        return {
          title: t('offer.offerFromFriendOfFriend'),
          description: t('offer.noDirectConnection'),
          positiveButtonText: t('common.gotIt'),
        }
      })()

      return yield* _(
        set(askAreYouSureActionAtom, {
          steps: [{...modalContent, type: 'StepWithText'}],
          variant: 'info',
        }),
        Effect.ignore
      )
    })
  }
)

export const reportOfferActionAtom = atom(
  null,
  (get, set, offer: OneOfferInState) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const api = get(apiAtom)
      const isClubOffer =
        !!offer.offerInfo.privatePart.clubIds &&
        offer.offerInfo.privatePart.clubIds.length > 0
      const reportedFlagAtom = createSingleOfferReportedFlagAtom(
        offer.offerInfo.offerId
      )

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'danger',
          steps: [
            {
              type: 'StepWithText',
              title: t('offer.report.areYouSureTitle'),
              description: t('offer.report.areYouSureText'),
              positiveButtonText: t('offer.report.yes'),
              negativeButtonText: t('common.nope'),
            },
          ],
        })
      )

      set(loadingOverlayDisplayedAtom, true)

      if (isClubOffer) {
        yield* _(
          Record.toEntries(get(clubsToKeyHolderAtom)),
          Array.findFirst(
            ([clubUuid]) =>
              Array.isArray(offer.offerInfo.privatePart.clubIds) &&
              Array.contains(clubUuid)(offer.offerInfo.privatePart.clubIds)
          ),
          Option.map(([_, keyPair]) =>
            api.offer.reportClubOffer({
              offerId: offer.offerInfo.offerId,
              keyPair,
            })
          )
        )
      } else {
        yield* _(
          api.offer.reportOffer({
            body: {
              offerId: offer.offerInfo.offerId,
            },
          })
        )
      }

      if (isClubOffer) {
        yield* _(
          offer.offerInfo.privatePart.clubIds,
          Array.filterMap((clubUuid) =>
            Record.get(get(clubsToKeyHolderAtom), clubUuid).pipe(
              Option.map((keyPair) =>
                api.contact
                  .reportClub({
                    clubUuid,
                    offerId: offer.offerInfo.offerId,
                    keyPair,
                  })
                  .pipe(Effect.either)
              )
            )
          ),
          Effect.all,
          Effect.map(
            Array.map(
              Either.mapLeft((left) => {
                if (
                  left._tag !== 'ClubAlreadyReportedError' &&
                  left._tag !== 'NetworkError'
                ) {
                  reportError(
                    'error',
                    new Error('Error while reporting club'),
                    {e: left}
                  )
                }
              })
            )
          )
        )
      }

      set(reportedFlagAtom, true)
      set(loadingOverlayDisplayedAtom, false)

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              title: t('offer.report.thankYou'),
              description: t('offer.report.inappropriateContentWasReported'),
              positiveButtonText: t('common.continue'),
            },
          ],
        }),
        Effect.ignore
      )

      return true
    }).pipe(
      Effect.catchAll((e) => {
        set(loadingOverlayDisplayedAtom, false)

        if (e._tag === 'ReportOfferLimitReachedError') {
          Alert.alert(t('offer.report.reportLimitReached'))
        } else if (e._tag !== 'UserDeclinedError') {
          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
        }

        return Effect.succeed(false)
      })
    )
  }
)

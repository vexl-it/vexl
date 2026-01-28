import {type ClubCode} from '@vexl-next/domain/src/general/clubs'
import {eitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option, Struct} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import {showErrorAlert} from '../../../components/ErrorAlert'
import clubImagePlaceholderSvg from '../../../components/JoinClubFlow/images/clubImagePlaceholderSvg'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {generateVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {clubsToKeyHolderAtom} from './clubsToKeyHolderAtom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from './refreshClubsActionAtom'

export const submitCodeToJoinClubActionAtom = atom(
  null,
  (get, set, code: ClubCode) => {
    const {t} = get(translationAtom)
    const api = get(apiAtom)

    return Effect.gen(function* (_) {
      const newKeypair = yield* _(eitherToEffect(generateKeyPair()))
      const notificationToken = yield* _(
        getNotificationTokenE(),
        Effect.map(Option.fromNullable)
      )

      const club = yield* _(
        api.contact.getClubInfoByAccessCode({
          code,
          keyPair: newKeypair,
        })
      )

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              imageSource: {
                type: club.club.clubImageUrl ? 'imageUri' : 'svgXml',
                imageUri: club.club.clubImageUrl,
                svgXml: clubImagePlaceholderSvg,
              },
              title: t('clubs.wannaStepInsideOfClub', {
                clubName: club.club.name,
              }),
              description: t(
                club.isModerator
                  ? 'clubs.joiningClubGivesYouAccessAsModerator'
                  : 'clubs.joiningClubGivesYouAccess',
                {
                  clubName: club.club.name,
                }
              ),
              negativeButtonText: t('common.cancel'),
              positiveButtonText: t('common.continue'),
            },
          ],
        })
      )

      set(loadingOverlayDisplayedAtom, true)

      const myStoredClubs = get(clubsToKeyHolderAtom)
      const keyPair = newKeypair

      if (myStoredClubs[club.club.uuid]) {
        yield* _(Effect.fail(new MemberAlreadyInClubError()))
      }

      set(clubsToKeyHolderAtom, (prevState) => ({
        ...prevState,
        [club.club.uuid]: keyPair,
      }))

      const vexlNotificationToken = yield* _(set(generateVexlTokenActionAtom))

      const {clubInfoForUser} = yield* _(
        api.contact
          .joinClub({
            keyPair,
            code,
            contactsImported: true,
            notificationToken,
            vexlNotificationToken: Option.some(vexlNotificationToken),
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

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              imageSource: {
                type: club.club.clubImageUrl ? 'imageUri' : 'svgXml',
                imageUri: club.club.clubImageUrl,
                svgXml: clubImagePlaceholderSvg,
              },
              title: t('clubs.clubJoinedSuccessfully'),
              description: t('clubs.nowYouWillSeeOffersFromClubMembers'),
              positiveButtonText: t('common.ok'),
            },
          ],
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
        if (e._tag === 'UserDeclinedError') return Effect.succeed(false)

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
            set(askAreYouSureActionAtom, {
              variant: 'danger',
              steps: [
                {
                  type: 'StepWithText',
                  title: t('clubs.joiningUnsucessful'),
                  description,
                  positiveButtonText: t('common.close'),
                },
              ],
            }),
            Effect.succeed(false)
          )
        }

        if (
          e._tag === 'InvalidChallengeError' ||
          e._tag === 'HttpApiDecodeError' ||
          e._tag === 'ResponseError' ||
          e._tag === 'RequestError' ||
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

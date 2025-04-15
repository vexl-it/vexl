import {type ClubCode} from '@vexl-next/domain/src/general/clubs'
import {eitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option, Struct} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import clubImagePlaceholderSvg from '../../../components/JoinClubFlow/images/clubImagePlaceholderSvg'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {navigationRef} from '../../../utils/navigation'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {myStoredClubsAtom} from './clubsStore'
import {clubsWithMembersAtom} from './clubsWithMembersAtom'

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
              description: t('clubs.joiningClubGivesYouAccess', {
                clubName: club.club.name,
              }),
              negativeButtonText: t('common.cancel'),
              positiveButtonText: t('common.continue'),
            },
          ],
        })
      )

      const myStoredClubs = get(myStoredClubsAtom)
      const keyPair = newKeypair

      if (myStoredClubs[club.club.uuid]) {
        yield* _(Effect.fail(new MemberAlreadyInClubError()))
      }

      set(myStoredClubsAtom, (prevState) => ({
        ...prevState,
        [clubInfoForUser.club.uuid]: keyPair,
      }))

      const {clubInfoForUser} = yield* _(
        api.contact
          .joinClub({
            keyPair,
            code,
            contactsImported: true,
            notificationToken,
          })
          .pipe(
            Effect.tapError(() =>
              Effect.sync(() => {
                set(myStoredClubsAtom, Struct.omit(clubInfoForUser.club.uuid))
              })
            )
          )
      )

      yield* _(set(clubsWithMembersAtom))

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

      if (navigationRef.isReady()) {
        navigationRef.navigate('ClubDetail', {
          clubUuid: club.club.uuid,
        })
      }

      return true
    }).pipe(
      Effect.catchAll((e) =>
        Effect.sync(() => {
          if (e._tag === 'UserDeclinedError') return false

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
              return t('common.unknownError')
            })()

            set(askAreYouSureActionAtom, {
              variant: 'danger',
              steps: [
                {
                  type: 'StepWithText',
                  imageSource: {
                    type: 'requiredImage',
                    image: require('../../../components/images/block.png'),
                  },
                  title: t('clubs.joiningUnsucessful'),
                  description,
                  positiveButtonText: t('common.close'),
                },
              ],
            }).pipe(Effect.runFork)
            return false
          }

          if (
            e._tag === 'UnauthorizedError' ||
            e._tag === 'UnexpectedApiResponseError' ||
            e._tag === 'UnknownClientError' ||
            e._tag === 'UnknownServerError' ||
            e._tag === 'CryptoError'
          ) {
            reportError('error', new Error('Join club error'), {e})
          }

          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
          return false
        })
      )
    )
  }
)

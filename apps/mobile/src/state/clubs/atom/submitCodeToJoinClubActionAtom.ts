import {type ClubCode} from '@vexl-next/domain/src/general/clubs'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {eitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option, Struct} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {clubToJoinAtom} from '../../../components/JoinClubFlow/atoms'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {generateVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {clubsToKeyHolderAtom} from './clubsToKeyHolderV2Atom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from './refreshClubsActionAtom'

interface SubmitCodeToJoinClubOptions {
  readonly code: ClubCode
  readonly onCodeNotFound?: () => void
  readonly skipConfirmation?: boolean
}

type SubmitCodeToJoinClubInput = ClubCode | SubmitCodeToJoinClubOptions

function getCodeFromInput(input: SubmitCodeToJoinClubInput): ClubCode {
  return typeof input === 'string' ? input : input.code
}

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

      yield* _(
        set(globalDialogAtom, {
          title: t('clubs.clubJoinedSuccessfully'),
          subtitle: t('clubs.nowYouWillSeeOffersFromClubMembers'),
          positiveButtonText: t('common.ok'),
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
          set(clubToJoinAtom, club.club)
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

        if (
          e._tag === 'InvalidChallengeError' ||
          e._tag === 'HttpApiDecodeError' ||
          e._tag === 'ResponseError' ||
          e._tag === 'RequestError' ||
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

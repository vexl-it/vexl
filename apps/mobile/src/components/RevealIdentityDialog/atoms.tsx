import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect} from 'effect'
import {atom, type Atom, type PrimitiveAtom} from 'jotai'
import {type RevealMessageType} from '../../state/chat/atoms/revealIdentityActionAtom'
import {
  realUserImageAtom,
  realUserNameAtom,
} from '../../state/session/userDataAtoms'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {
  askAreYouSureActionAtom,
  type StepWithChildren,
  type StepWithText,
} from '../AreYouSureDialog'
import ClubsRevealIdentityDialogContent from './ClubsRevealIdentityDialogContent'
import {
  ImageDialogContent,
  UsernameDialogContent,
} from './RevealIdentityDialogContent'

interface RevealIdentityActionParams {
  type: 'REQUEST_REVEAL' | 'RESPOND_REVEAL'
  revealIdentityUsernameAtom: PrimitiveAtom<string>
  usernameSavedForFutureUseAtom: PrimitiveAtom<boolean>
  revealIdentityImageUriAtom: PrimitiveAtom<UriString | undefined>
  imageSavedForFutureUseAtom: PrimitiveAtom<boolean>
  commonConnectionsCountAtom: Atom<number>
}

export const revealIdentityDialogUIAtom = atom(
  null,
  (get, set, params: RevealIdentityActionParams) => {
    const {t} = get(translationAtom)
    const {
      type,
      revealIdentityUsernameAtom,
      usernameSavedForFutureUseAtom,
      revealIdentityImageUriAtom,
      imageSavedForFutureUseAtom,
      commonConnectionsCountAtom,
    } = params

    const thereAreOnlyClubConnectionsWithOtherSide =
      get(commonConnectionsCountAtom) === 0

    const modalContentForFirstAndSecondDegreeConnections = (() => {
      if (type === 'REQUEST_REVEAL') {
        return {
          type: 'StepWithText',
          title: t('messages.identityRevealRequestModal.title'),
          description: t('messages.identityRevealRequestModal.text'),
          negativeButtonText: t('common.back'),
          positiveButtonText: t('common.continue'),
        } satisfies StepWithText
      }
      return {
        type: 'StepWithText',
        title: t('messages.identityRevealRespondModal.title'),
        description: t('messages.identityRevealRespondModal.text'),
        negativeButtonText: t('common.no'),
        positiveButtonText: t('common.continue'),
      } satisfies StepWithText
    })()

    const modalContentForClubsConnectionsOnly = {
      type: 'StepWithChildren',
      MainSectionComponent: ClubsRevealIdentityDialogContent,
      positiveButtonText: t('common.yes'),
      negativeButtonText: t('common.no'),
    } satisfies StepWithChildren<void>

    const modalContent = thereAreOnlyClubConnectionsWithOtherSide
      ? modalContentForClubsConnectionsOnly
      : modalContentForFirstAndSecondDegreeConnections

    return Effect.gen(function* (_) {
      const dialogResultEffect = set(askAreYouSureActionAtom, {
        steps: [
          modalContent,
          {
            type: 'StepWithChildren',
            MainSectionComponent: () => (
              <ImageDialogContent
                imageSavedForFutureUseAtom={imageSavedForFutureUseAtom}
                revealIdentityImageUriAtom={revealIdentityImageUriAtom}
              />
            ),
            positiveButtonText: t('common.continue'),
            negativeButtonText: t('common.close'),
          },
          {
            type: 'StepWithChildren',
            MainSectionComponent: () => (
              <UsernameDialogContent
                revealIdentityUsernameAtom={revealIdentityUsernameAtom}
                usernameSavedForFutureUseAtom={usernameSavedForFutureUseAtom}
              />
            ),
            goBackOnNegativeButtonPress: true,
            positiveButtonText: t('common.continue'),
            negativeButtonText: t('common.back'),
          },
        ],
        variant: 'info',
      })

      const revealType = yield* _(
        dialogResultEffect,
        Effect.match({
          onFailure: (e) => {
            if (e._tag === 'UserDeclinedError' && type === 'REQUEST_REVEAL') {
              set(imageSavedForFutureUseAtom, false)
              set(usernameSavedForFutureUseAtom, false)
              return null
            }

            if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
              return 'DISAPPROVE_REVEAL' as RevealMessageType
            }

            throw new Error('Dialog error', {cause: e})
          },
          onSuccess: () =>
            type === 'RESPOND_REVEAL'
              ? ('APPROVE_REVEAL' as RevealMessageType)
              : ('REQUEST_REVEAL' as RevealMessageType),
        }),
        Effect.catchAll((e) => Effect.fail(e))
      )

      if (revealType === null) {
        return yield* _(
          Effect.fail(
            toBasicError('UserDeclinedError')(new Error('User declined'))
          )
        )
      }

      if (revealType === 'DISAPPROVE_REVEAL') {
        return {
          type: revealType,
          username: undefined,
          imageUri: undefined,
        }
      }

      const username = UserName.safeParse(
        get(revealIdentityUsernameAtom).trim()
      )

      if (!username.success) {
        return yield* _(
          Effect.fail(
            toBasicError('UsernameEmptyError')(new Error('UsernameEmpty'))
          )
        )
      }

      const usernameSavedForFutureUse = get(usernameSavedForFutureUseAtom)

      if (usernameSavedForFutureUse) set(realUserNameAtom, username.data)

      const imageSavedForFutureUse = get(imageSavedForFutureUseAtom)
      const revealIdentityImageUri = get(revealIdentityImageUriAtom)

      if (imageSavedForFutureUse && revealIdentityImageUri)
        set(realUserImageAtom, {
          type: 'imageUri',
          imageUri: revealIdentityImageUri,
        })

      return {
        type: revealType,
        username: username.data,
        imageUri: revealIdentityImageUri,
      }
    })
  }
)

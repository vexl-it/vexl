import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {atom, type PrimitiveAtom} from 'jotai'
import {type RevealMessageType} from '../../state/chat/atoms/revealIdentityActionAtom'
import {
  realUserImageAtom,
  realUserNameAtom,
} from '../../state/session/userDataAtoms'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
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
    } = params

    const modalContent = (() => {
      if (type === 'REQUEST_REVEAL') {
        return {
          title: t('messages.identityRevealRequestModal.title'),
          description: t('messages.identityRevealRequestModal.text'),
          negativeButtonText: t('common.back'),
          positiveButtonText: t('common.continue'),
        }
      }
      return {
        title: t('messages.identityRevealRespondModal.title'),
        description: t('messages.identityRevealRespondModal.text'),
        negativeButtonText: t('common.no'),
        positiveButtonText: t('common.continue'),
      }
    })()

    return pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {...modalContent, type: 'StepWithText'},
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
      }),
      TE.match(
        (e) => {
          if (e._tag === 'UserDeclinedError' && type === 'REQUEST_REVEAL') {
            set(imageSavedForFutureUseAtom, false)
            set(usernameSavedForFutureUseAtom, false)
          }

          if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
            return E.right('DISAPPROVE_REVEAL' as RevealMessageType)
          }

          return E.left(e)
        },
        () =>
          E.right(
            type === 'RESPOND_REVEAL'
              ? ('APPROVE_REVEAL' as RevealMessageType)
              : ('REQUEST_REVEAL' as RevealMessageType)
          )
      ),
      TE.bindTo('type'),
      TE.bindW('username', ({type}) => {
        if (type === 'DISAPPROVE_REVEAL') return TE.right(undefined)

        const username = UserName.safeParse(
          get(revealIdentityUsernameAtom).trim()
        )

        if (!username.success)
          return TE.left(
            toBasicError('UsernameEmptyError')(new Error('UsernameEmpty'))
          )

        const usernameSavedForFutureUse = get(usernameSavedForFutureUseAtom)

        if (usernameSavedForFutureUse) set(realUserNameAtom, username.data)

        return TE.right(username.data)
      }),
      TE.bindW('imageUri', ({type}) => {
        if (type === 'DISAPPROVE_REVEAL') return TE.right(undefined)

        const imageSavedForFutureUse = get(imageSavedForFutureUseAtom)
        const revealIdentityImageUri = get(revealIdentityImageUriAtom)

        if (imageSavedForFutureUse && revealIdentityImageUri)
          set(realUserImageAtom, {
            type: 'imageUri',
            imageUri: revealIdentityImageUri,
          })

        return TE.right(revealIdentityImageUri)
      })
    )
  }
)

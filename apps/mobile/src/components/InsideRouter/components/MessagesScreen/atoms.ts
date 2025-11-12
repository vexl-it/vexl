import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import deleteChatActionAtom from '../../../../state/chat/atoms/deleteChatActionAtom'
import {
  focusChatWithMessagesByKeysAtom,
  type ChatWithMessagesAtom,
} from '../../../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../../../state/chat/domain'
import valueOrDefaultAtom from '../../../../utils/atomUtils/valueOrDefaultAtom'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import reportError from '../../../../utils/reportError'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'
import {
  askAreYouSureActionAtom,
  type AreYouSureDialogAtomStepResult,
} from '../../../AreYouSureDialog'
import {showErrorAlert} from '../../../ErrorAlert'
import {loadingOverlayDisplayedAtom} from '../../../LoadingOverlayProvider'

export const deleteChatFromListActionAtom = atom(
  null,
  (
    get,
    set,
    {
      otherSideKey,
      inboxKey,
      skipAsk,
    }: {
      otherSideKey: PublicKeyPemBase64
      inboxKey: PublicKeyPemBase64
      skipAsk: boolean
    }
  ) => {
    const {t} = get(translationAtom)
    const chatWithMessagesAtom: ChatWithMessagesAtom =
      focusChatWithMessagesByKeysAtom({
        otherSideKey,
        inboxKey,
      })

    const nonNullChatWithMessagesAtom = valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })

    const deleteChatAtom = deleteChatActionAtom(nonNullChatWithMessagesAtom)

    return pipe(
      skipAsk
        ? TE.right([{type: 'noResult'}] as AreYouSureDialogAtomStepResult[])
        : set(askAreYouSureActionAtom, {
            variant: 'danger',
            steps: [
              {
                type: 'StepWithText',
                title: t('messages.deleteChat'),
                description: t('messages.areYouSureYouWantToDeleteChat'),
                positiveButtonText: t('common.yes'),
                negativeButtonText: t('common.cancel'),
              },
            ],
          }).pipe(effectToTaskEither),
      TE.map((val) => {
        set(loadingOverlayDisplayedAtom, true)
        return val
      }),
      TE.chainW(() => set(deleteChatAtom, {text: 'deleting chat'})),
      TE.match(
        (e) => {
          if (e._tag !== 'UserDeclinedError') {
            reportError('error', new Error('Error deleting chat'), {
              e,
            })

            showErrorAlert({
              title: t('common.somethingWentWrong'),
              description:
                toCommonErrorMessage(e, t) ??
                t('common.somethingWentWrongDescription'),
              error: e,
            })
          }
          return false
        },
        () => {
          return true
        }
      ),
      T.map(() => {
        set(loadingOverlayDisplayedAtom, false)
      })
    )()
  }
)

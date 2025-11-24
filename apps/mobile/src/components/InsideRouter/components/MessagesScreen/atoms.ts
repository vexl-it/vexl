import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect} from 'effect'
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
import {
  toCommonErrorMessage,
  type SomeError,
} from '../../../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
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
  ): Promise<boolean> => {
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

    const effect = Effect.gen(function* (_) {
      if (!skipAsk) {
        const askResult = yield* _(
          set(askAreYouSureActionAtom, {
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
          }),
          Effect.either
        )

        if (askResult._tag === 'Left') {
          set(loadingOverlayDisplayedAtom, false)
          return false
        }
      }

      set(loadingOverlayDisplayedAtom, true)

      const deleteResult = yield* _(
        set(deleteChatAtom, {text: 'deleting chat'}),
        Effect.either
      )

      set(loadingOverlayDisplayedAtom, false)

      if (deleteResult._tag === 'Left') {
        const e = deleteResult.left as SomeError
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
        return false
      }

      return true
    }) as Effect.Effect<boolean, never, never>

    return effect.pipe(Effect.runPromise)
  }
)

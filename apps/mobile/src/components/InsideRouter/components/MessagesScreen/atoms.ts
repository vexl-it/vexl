import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
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
import showErrorAlert from '../../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'
import {loadingOverlayDisplayedAtom} from '../../../LoadingOverlayProvider'

export const deleteChatFromListActionAtom = atom(
  null,
  (
    get,
    set,
    {
      otherSideKey,
      inboxKey,
    }: {otherSideKey: PublicKeyPemBase64; inboxKey: PublicKeyPemBase64}
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
      TE.Do,
      TE.map(() => {
        set(loadingOverlayDisplayedAtom, true)
      }),
      TE.chain(() => set(deleteChatAtom, {text: 'deleting chat'})),
      TE.match(
        (e) => {
          reportError('error', new Error('Error deleting chat'), {
            e,
          })

          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
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

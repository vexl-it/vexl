import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {type ChatMessageWithState} from '../domain'
import {atom} from 'jotai'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/dist/utils/ExtractLeft'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {sessionDataOrDummyAtom} from '../../session'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {privateApiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {sendCancelMessagingRequest} from '@vexl-next/resources-utils/dist/chat/sendCancelMessagingRequest'
import {Alert} from 'react-native'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {pipe} from 'fp-ts/function'
import {type OfferInfo} from '@vexl-next/domain/dist/general/offers'
import {
  askAreYouSureActionAtom,
  type UserDeclinedError,
} from '../../../components/AreYouSureDialog'
import addMessageToChat, {
  addMessageToMessagesArray,
} from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import showErrorAlert from '../../../utils/showErrorAlert'

type ChatNotFoundError = BasicError<'ChatNotFoundError'>
type CancelRequestApprovalErrors = ExtractLeftTE<
  ReturnType<ChatPrivateApi['cancelRequestApproval']>
>

const cancelRequestActionAtomHandleUI = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OfferInfo}
  ): TE.TaskEither<
    | ErrorEncryptingMessage
    | ChatNotFoundError
    | CancelRequestApprovalErrors
    | UserDeclinedError,
    ChatMessageWithState
  > => {
    const session = get(sessionDataOrDummyAtom)
    const chatAtom = focusChatByInboxKeyAndSenderKey({
      inboxKey: session.privateKey.publicKeyPemBase64,
      senderKey: originOffer.publicPart.offerPublicKey,
    })

    const chatWithMessages = get(chatAtom)
    if (!chatWithMessages)
      return TE.left({
        _tag: 'ChatNotFoundError',
        error: new Error('Chat not found'),
      })

    const {chat} = chatWithMessages
    const api = get(privateApiAtom)
    const {t} = get(translationAtom)

    const messageToSend: ChatMessage = {
      text,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      messageType: 'CANCEL_REQUEST_MESSAGING',
      senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    }

    return pipe(
      TE.Do,
      TE.chainW(() =>
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('messages.cancelRequestDialog.title'),
              description: t('messages.cancelRequestDialog.description'),
              negativeButtonText: t('common.back'),
              positiveButtonText: t('messages.cancelRequestDialog.yes'),
            },
          ],
          variant: 'info',
        })
      ),
      TE.chainW(() => {
        set(loadingOverlayDisplayedAtom, true)

        return sendCancelMessagingRequest({
          api: api.chat,
          text,
          fromKeypair: chat.inbox.privateKey,
          toPublicKey: chat.otherSide.publicKey,
        })
      }),
      TE.map((): ChatMessageWithState => {
        const successMessage = {
          message: messageToSend,
          state: 'sent',
        } as const
        set(chatAtom, (old) => ({
          ...old,
          messages: addMessageToMessagesArray(old.messages)(successMessage),
        }))
        return successMessage
      }),
      TE.mapLeft((error) => {
        if (error._tag === 'UserDeclinedError') {
          return error
        }
        if (error._tag === 'OtherSideAccountDeleted') {
          set(
            chatAtom,
            addMessageToChat(
              createAccountDeletedMessage({
                senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
              })
            )
          )
          Alert.alert(t('offer.otherSideAccountDeleted'))

          return error
        }

        showErrorAlert({
          title: toCommonErrorMessage(error, t) ?? t('common.unknownError'),
          error,
        })
        return error
      }),
      T.map((result) => {
        set(loadingOverlayDisplayedAtom, false)
        return result
      })
    )
  }
)
export default cancelRequestActionAtomHandleUI

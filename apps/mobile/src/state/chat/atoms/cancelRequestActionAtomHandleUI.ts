import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {sendCancelMessagingRequest} from '@vexl-next/resources-utils/src/chat/sendCancelMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {type JsonStringifyError} from '@vexl-next/resources-utils/src/utils/parsing'
import {
  type ErrorSigningChallenge,
  type InvalidChallengeError,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type ErrorGeneratingChallenge} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {Effect, type ParseResult} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {version} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {type ChatMessageWithState} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import {type ChatWithMessagesAtom} from './focusChatWithMessagesAtom'

type ChatNotFoundError = BasicError<'ChatNotFoundError'>
type UserDeclinedError = BasicError<'UserDeclinedError'>
type CancelRequestApprovalErrors = Effect.Effect.Error<
  ReturnType<ChatApi['cancelRequestApproval']>
>

const cancelRequestActionAtomHandleUI = atom(
  null,
  (
    get,
    set,
    {text, chatAtom}: {text: string; chatAtom: ChatWithMessagesAtom}
  ): Effect.Effect<
    ChatMessageWithState,
    | ChatNotFoundError
    | CancelRequestApprovalErrors
    | UserDeclinedError
    | JsonStringifyError
    | ParseResult.ParseError
    | ErrorEncryptingMessage
    | InvalidChallengeError
    | ErrorGeneratingChallenge
    | ErrorSigningChallenge
    | CryptoError
  > => {
    const chatWithMessages = get(chatAtom)
    if (!chatWithMessages)
      return Effect.fail({
        _tag: 'ChatNotFoundError',
        error: new Error('Chat not found'),
      })

    const {chat} = chatWithMessages
    const offer =
      chat.origin.type === 'theirOffer'
        ? chat.origin.offer?.offerInfo.publicPart
        : undefined
    const api = get(apiAtom)
    const {t} = get(translationAtom)
    const userDeclinedError = toBasicError('UserDeclinedError')(
      new Error('Declined')
    )

    return Effect.gen(function* (_) {
      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('messages.cancelRequestDialog.title'),
          subtitle: t('messages.cancelRequestDialog.description'),
          negativeButtonText: t('common.back'),
          positiveButtonText: t('messages.cancelRequestDialog.yes'),
          positiveButtonVariant: 'destructive',
        })
      )

      if (!confirmed) {
        return yield* _(Effect.fail(userDeclinedError))
      }

      set(loadingOverlayDisplayedAtom, true)

      const sentMessage = yield* _(
        sendCancelMessagingRequest({
          api: api.chat,
          text,
          fromKeypair: chat.inbox.privateKey,
          toPublicKey: chat.otherSide.publicKey,
          myVersion: version,
          theirNotificationCypher: offer?.fcmCypher,
          notificationApi: api.notification,
          otherSideVersion: offer?.authorClientVersion,
        })
      )

      const successMessage: ChatMessageWithState = {
        message: sentMessage.message,
        state: 'sent',
        receivedByServerAt: sentMessage.receivedByServerAt,
      }

      set(chatAtom, addMessageToChat(successMessage))

      return successMessage
    }).pipe(
      Effect.tapError((error) =>
        Effect.sync(() => {
          if (error._tag === 'UserDeclinedError') {
            return
          }

          if (error._tag === 'ReceiverInboxDoesNotExistError') {
            set(
              chatAtom,
              addMessageToChat(
                createAccountDeletedMessage({
                  senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
                })
              )
            )
            Alert.alert(t('offer.otherSideAccountDeleted'))

            return
          }

          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(error, t) ??
              t('common.somethingWentWrongDescription'),
            error,
          })
        })
      ),
      Effect.ensuring(
        Effect.sync(() => {
          set(loadingOverlayDisplayedAtom, false)
        })
      )
    )
  }
)
export default cancelRequestActionAtomHandleUI

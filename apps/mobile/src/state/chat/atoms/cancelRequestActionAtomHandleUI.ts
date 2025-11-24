import {type ChatMessagePayload} from '@vexl-next/domain/src/general/messaging'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {sendCancelMessagingRequest} from '@vexl-next/resources-utils/src/chat/sendCancelMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import {
  type ErrorSigningChallenge,
  type InvalidChallengeError,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type ErrorGeneratingChallenge} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {
  askAreYouSureActionAtom,
  type UserDeclinedError,
} from '../../../components/AreYouSureDialog'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {version} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {sessionDataOrDummyAtom} from '../../session'
import {type ChatMessageWithState} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'

type ChatNotFoundError = BasicError<'ChatNotFoundError'>
type CancelRequestApprovalErrors = Effect.Effect.Error<
  ReturnType<ChatApi['cancelRequestApproval']>
>

const cancelRequestActionAtomHandleUI = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OfferInfo}
  ): Effect.Effect<
    ChatMessageWithState,
    | ChatNotFoundError
    | CancelRequestApprovalErrors
    | UserDeclinedError
    | JsonStringifyError
    | ZodParseError<ChatMessagePayload>
    | ErrorEncryptingMessage
    | InvalidChallengeError
    | ErrorGeneratingChallenge
    | ErrorSigningChallenge
    | CryptoError
  > => {
    const session = get(sessionDataOrDummyAtom)
    const chatAtom = focusChatByInboxKeyAndSenderKey({
      inboxKey: session.privateKey.publicKeyPemBase64,
      senderKey: originOffer.publicPart.offerPublicKey,
    })

    const chatWithMessages = get(chatAtom)
    if (!chatWithMessages)
      return Effect.fail({
        _tag: 'ChatNotFoundError',
        error: new Error('Chat not found'),
      } as ChatNotFoundError)

    const {chat} = chatWithMessages
    const offer =
      chat.origin.type === 'theirOffer'
        ? chat.origin.offer?.offerInfo.publicPart
        : undefined
    const api = get(apiAtom)
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      yield* _(
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
          variant: 'danger',
        })
      )

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
        }),
        Effect.tapError((error) => {
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
            return Effect.void
          }

          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(error, t) ??
              t('common.somethingWentWrongDescription'),
            error,
          })
          return Effect.void
        }),
        Effect.ensuring(
          Effect.sync(() => {
            set(loadingOverlayDisplayedAtom, false)
          })
        )
      )

      const successMessage = {
        message: sentMessage,
        state: 'sent',
      } as const

      set(chatAtom, addMessageToChat(successMessage))
      return successMessage
    })
  }
)
export default cancelRequestActionAtomHandleUI

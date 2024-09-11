import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {sendMessagingRequest} from '@vexl-next/resources-utils/src/chat/sendMessagingRequest'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationToken} from '../../../utils/notifications'
import {checkNotificationPermissionsAndAskIfPossibleTEActionAtom} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {sessionDataOrDummyAtom} from '../../session'
import {version} from './../../../utils/environment'
import {createUserInboxIfItDoesNotExistAtom} from './createUserInboxIfItDoesNotExistAtom'
import generateMyFcmTokenInfoActionAtom from './generateMyFcmTokenInfoActionAtom'
import upsertChatForTheirOfferActionAtom from './upsertChatForTheirOfferActionAtom'

const sendRequestActionAtom = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OneOfferInState}
  ) => {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)

    return pipe(
      set(generateMyFcmTokenInfoActionAtom, undefined, session.privateKey),
      TE.fromTask,
      TE.bindTo('encryptedToken'),
      TE.bind('message', ({encryptedToken}) =>
        sendMessagingRequest({
          text,
          notificationApi: api.notification,
          theirFcmCypher: originOffer.offerInfo.publicPart.fcmCypher,
          api: api.chat,
          fromKeypair: session.privateKey,
          myVersion: version,
          toPublicKey: originOffer.offerInfo.publicPart.offerPublicKey,
          otherSideVersion:
            originOffer.offerInfo.publicPart.authorClientVersion,
          myFcmCypher: O.toUndefined(encryptedToken)?.cypher,
          lastReceivedFcmCypher: originOffer.offerInfo.publicPart.fcmCypher,
        })
      ),
      TE.map(({message, encryptedToken}) =>
        set(upsertChatForTheirOfferActionAtom, {
          inbox: {privateKey: session.privateKey},
          initialMessage: {state: 'sent', message},
          sentFcmTokenInfo: O.toUndefined(encryptedToken),
          offer: originOffer,
        })
      )
    )
  }
)

export const sendRequestHandleUIActionAtom = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OneOfferInState}
  ) => {
    const {t} = get(translationAtom)
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)

    const sendRequestHandleInboxMissing = pipe(
      set(sendRequestActionAtom, {text, originOffer}),
      TE.matchE(
        (e) => {
          if (e._tag === 'SenderInboxDoesNotExistError') {
            reportError('warn', new Error('Sender user inbox does not exist'), {
              e,
            })

            return pipe(
              TE.Do,
              TE.chainTaskK(getNotificationToken),
              TE.chainW((token) =>
                pipe(
                  api.chat.createInbox({
                    token: token ?? undefined,
                    keyPair: session.privateKey,
                  }),
                  TE.mapLeft(toBasicError('ApiErrorCreatingInbox'))
                )
              ),
              TE.chainW(() => set(sendRequestActionAtom, {text, originOffer}))
            )
          }

          return TE.left(e)
        },
        (a) => {
          return TE.right(a)
        }
      )
    )

    const sendRequestWithLoadingOverlay = pipe(
      TE.Do,
      TE.map(() => {
        set(loadingOverlayDisplayedAtom, true)
        set(createUserInboxIfItDoesNotExistAtom, session.privateKey)
      }),
      TE.chainW(() => sendRequestHandleInboxMissing),
      TE.mapLeft((e) => {
        if (e._tag === 'ApiErrorCreatingInbox') {
          reportError(
            'error',
            new Error('Error recreating user inbox after it was deleted'),
            {e}
          )

          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
        }
        // TODO handle request sent
        set(loadingOverlayDisplayedAtom, false)
        return e
      }),
      TE.map((chat) => {
        set(loadingOverlayDisplayedAtom, false)
        return chat
      })
    )

    return pipe(
      TE.Do,
      TE.chainW(() =>
        set(checkNotificationPermissionsAndAskIfPossibleTEActionAtom)
      ),
      TE.chainW(() => sendRequestWithLoadingOverlay)
    )
  }
)

export default sendRequestActionAtom

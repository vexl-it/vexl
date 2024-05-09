import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {sendMessagingRequest} from '@vexl-next/resources-utils/src/chat/sendMessagingRequest'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {version} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {sessionDataOrDummyAtom} from '../../session'
import {createUserInboxIfItDoesNotExistAtom} from './createUserInboxIfItDoesNotExistAtom'
import upsertChatForTheirOfferActionAtom from './upsertChatForTheirOfferActionAtom'

const sendRequestActionAtom = atom(
  null,
  (
    get,
    set,
    {text, originOffer}: {text: string; originOffer: OneOfferInState}
  ) => {
    const api = get(privateApiAtom)
    const session = get(sessionDataOrDummyAtom)

    return pipe(
      sendMessagingRequest({
        text,
        api: api.chat,
        fromKeypair: session.privateKey,
        myVersion: version,
        toPublicKey: originOffer.offerInfo.publicPart.offerPublicKey,
      }),
      TE.map((message) =>
        set(upsertChatForTheirOfferActionAtom, {
          inbox: {privateKey: session.privateKey},
          initialMessage: {state: 'sent', message},
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
    const api = get(privateApiAtom)
    const session = get(sessionDataOrDummyAtom)

    set(loadingOverlayDisplayedAtom, true)
    set(createUserInboxIfItDoesNotExistAtom, session.privateKey)
    return pipe(
      pipe(
        set(sendRequestActionAtom, {text, originOffer}),
        TE.matchE(
          (e) => {
            if (e._tag === 'SenderUserInboxDoesNotExistError') {
              reportError(
                'warn',
                new Error('Sender user inbox does not exist'),
                {e}
              )

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
      ),
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
  }
)

export default sendRequestActionAtom

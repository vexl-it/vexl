import {atom} from 'jotai'
import {type OfferInfo} from '@vexl-next/domain/dist/general/offers'
import {privateApiAtom} from '../../../api'
import {sessionDataOrDummyAtom} from '../../session'
import {pipe} from 'fp-ts/function'
import {sendMessagingRequest} from '@vexl-next/resources-utils/dist/chat/sendMessagingRequest'
import * as TE from 'fp-ts/TaskEither'
import upsertChatForTheirOfferActionAtom from './upsertChatForTheirOfferActionAtom'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import * as O from 'fp-ts/Option'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../utils/showErrorAlert'

const sendRequestActionAtom = atom(
  null,
  (get, set, {text, originOffer}: {text: string; originOffer: OfferInfo}) => {
    const api = get(privateApiAtom)
    const session = get(sessionDataOrDummyAtom)

    return pipe(
      sendMessagingRequest({
        text,
        api: api.chat,
        fromKeypair: session.privateKey,
        toPublicKey: originOffer.publicPart.offerPublicKey,
      }),
      TE.map((message) =>
        set(upsertChatForTheirOfferActionAtom, {
          inbox: {privateKey: session.privateKey},
          initialMessage: {state: 'sent', message},
          offerInfo: originOffer,
        })
      )
    )
  }
)

export const sendRequestHandleUIActionAtom = atom(
  null,
  (get, set, {text, originOffer}: {text: string; originOffer: OfferInfo}) => {
    const {t} = get(translationAtom)

    set(loadingOverlayDisplayedAtom, true)
    return pipe(
      set(sendRequestActionAtom, {text, originOffer}),
      TE.match(
        (e) => {
          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
          // TODO handle request sent
          set(loadingOverlayDisplayedAtom, false)
          return O.none
        },
        (chat) => {
          set(loadingOverlayDisplayedAtom, false)
          return O.some(chat)
        }
      )
    )
  }
)

export default sendRequestActionAtom

import {type ContactReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {left, map, orElseW, right} from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {sessionDataOrDummyAtom} from '../../../state/session'
import {tradeChecklistDataAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {
  type RevealMessageType,
  type TradeChecklistRevealIntent,
} from '../domain'
import {revealContactActionAtom} from './updatesToBeSentAtom'

interface RevealContactWithUiFeedbackParams {
  readonly intent?: TradeChecklistRevealIntent
}

const DISAPPROVE_REVEAL: RevealMessageType = 'DISAPPROVE_REVEAL'
const APPROVE_REVEAL: RevealMessageType = 'APPROVE_REVEAL'
const REQUEST_REVEAL: RevealMessageType = 'REQUEST_REVEAL'

export const revealContactWithUiFeedbackAtom = atom(
  null,
  (get, set, params?: RevealContactWithUiFeedbackParams) => {
    const {t} = get(translationAtom)
    const {phoneNumber} = get(sessionDataOrDummyAtom)
    const tradeChecklistData = get(tradeChecklistDataAtom)
    const type = params?.intent
      ? params.intent === 'respond'
        ? 'RESPOND_REVEAL'
        : 'REQUEST_REVEAL'
      : !tradeChecklistData.contact.sent && tradeChecklistData.contact.received
        ? 'RESPOND_REVEAL'
        : 'REQUEST_REVEAL'

    const modalContent = (() => {
      if (type === 'REQUEST_REVEAL') {
        return {
          title: t('messages.contactRevealRequestModal.title'),
          description: t('messages.contactRevealRequestModal.text'),
          negativeButtonText: t('common.back'),
          positiveButtonText: t('common.confirm'),
        }
      }
      return {
        title: t('messages.contactRevealRespondModal.title'),
        description: t('messages.contactRevealRespondModal.text'),
        negativeButtonText: t('common.no'),
        positiveButtonText: t('common.yes'),
      }
    })()

    return pipe(
      set(askAreYouSureActionAtom, {
        steps: [{...modalContent, type: 'StepWithText'}],
        variant: 'info',
      }),
      effectToTaskEither,
      map((val) => {
        return val
      }),
      orElseW((e) => {
        if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
          return right(DISAPPROVE_REVEAL)
        }
        return left(e)
      }),
      map((result) =>
        result === DISAPPROVE_REVEAL
          ? DISAPPROVE_REVEAL
          : type === 'RESPOND_REVEAL'
            ? APPROVE_REVEAL
            : REQUEST_REVEAL
      ),
      map((type) => {
        const contactData = {
          status: type,
          fullPhoneNumber: phoneNumber,
        } satisfies ContactReveal

        set(revealContactActionAtom, contactData)
      })
    )
  }
)

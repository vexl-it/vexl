import {type ContactReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {type RevealMessageType} from '../../../state/chat/atoms/revealIdentityActionAtom'
import {sessionDataOrDummyAtom} from '../../../state/session'
import {tradeChecklistDataAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../../GlobalDialog'
import {revealContactActionAtom} from './updatesToBeSentAtom'

export const revealContactWithUiFeedbackAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const {phoneNumber} = get(sessionDataOrDummyAtom)
  const tradeChecklistData = get(tradeChecklistDataAtom)
  const type =
    !tradeChecklistData.contact.sent && tradeChecklistData.contact.received
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
  const userDeclinedError = toBasicError('UserDeclinedError')(
    new Error('Declined')
  )

  return pipe(
    set(globalDialogAtom, {
      title: modalContent.title,
      subtitle: modalContent.description,
      negativeButtonText: modalContent.negativeButtonText,
      positiveButtonText: modalContent.positiveButtonText,
    }),
    effectToTaskEither,
    TE.chainEitherK((confirmed) => {
      if (!confirmed) {
        if (type === 'RESPOND_REVEAL') {
          const declinedStatus: RevealMessageType = 'DISAPPROVE_REVEAL'
          return E.right(declinedStatus)
        }
        return E.left(userDeclinedError)
      }

      const revealStatus: RevealMessageType =
        type === 'RESPOND_REVEAL' ? 'APPROVE_REVEAL' : 'REQUEST_REVEAL'

      return E.right(revealStatus)
    }),
    TE.map((status) => {
      const contactData = {
        status,
        fullPhoneNumber: phoneNumber,
      } satisfies ContactReveal

      set(revealContactActionAtom, contactData)
    })
  )
})

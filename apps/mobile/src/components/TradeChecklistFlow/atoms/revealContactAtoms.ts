import {type ContactReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {type RevealMessageType} from '../../../state/chat/atoms/revealIdentityActionAtom'
import {type ChatIds} from '../../../state/chat/domain'
import {sessionDataOrDummyAtom} from '../../../state/session'
import * as fromChatAtoms from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {tradeChecklistDataAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {
  revealContactActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from './updatesToBeSentAtom'

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

  return set(askAreYouSureActionAtom, {
    steps: [{...modalContent, type: 'StepWithText'}],
    variant: 'info',
  }).pipe(
    Effect.matchEffect({
      onFailure: (e) => {
        // If user declined on respond reveal, that means they want to disapprove
        if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
          const contactData = {
            status: 'DISAPPROVE_REVEAL' as RevealMessageType,
            fullPhoneNumber: phoneNumber,
          } satisfies ContactReveal
          set(revealContactActionAtom, contactData)
          return Effect.void
        }
        // Otherwise propagate the error
        return Effect.fail(e)
      },
      onSuccess: () => {
        const revealType =
          type === 'RESPOND_REVEAL'
            ? ('APPROVE_REVEAL' as RevealMessageType)
            : ('REQUEST_REVEAL' as RevealMessageType)
        const contactData = {
          status: revealType,
          fullPhoneNumber: phoneNumber,
        } satisfies ContactReveal
        set(revealContactActionAtom, contactData)
        return Effect.void
      },
    })
  )
})

export const revealContactFromQuickActionBannerAtom = atom(
  null,
  async (get, set, chatIds: ChatIds) => {
    set(fromChatAtoms.setParentChatActionAtom, chatIds)

    return await set(revealContactWithUiFeedbackAtom).pipe(
      Effect.matchEffect({
        onFailure: () => Effect.succeed(false),
        onSuccess: () => set(submitTradeChecklistUpdatesActionAtom),
      }),
      Effect.runPromise
    )
  }
)

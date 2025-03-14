import {type ContactReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
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

  return pipe(
    set(askAreYouSureActionAtom, {
      steps: [{...modalContent, type: 'StepWithText'}],
      variant: 'info',
    }),
    effectToTaskEither,
    TE.map((val) => {
      return val
    }),
    TE.match(
      (e) => {
        if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
          return E.right('DISAPPROVE_REVEAL' as RevealMessageType)
        }
        return E.left(e)
      },
      () =>
        E.right(
          type === 'RESPOND_REVEAL'
            ? ('APPROVE_REVEAL' as RevealMessageType)
            : ('REQUEST_REVEAL' as RevealMessageType)
        )
    ),
    TE.map((type) => {
      const contactData = {
        status: type,
        fullPhoneNumber: phoneNumber,
      } satisfies ContactReveal

      set(revealContactActionAtom, contactData)
    })
  )
})

export const revealContactFromQuickActionBannerAtom = atom(
  null,
  async (get, set, chatIds: ChatIds) => {
    set(fromChatAtoms.setParentChatActionAtom, chatIds)

    return await pipe(
      set(revealContactWithUiFeedbackAtom),
      TE.matchW(
        (l) => {
          return T.of(false)
        },
        (r) => {
          return set(submitTradeChecklistUpdatesActionAtom)()
        }
      )
    )()
  }
)

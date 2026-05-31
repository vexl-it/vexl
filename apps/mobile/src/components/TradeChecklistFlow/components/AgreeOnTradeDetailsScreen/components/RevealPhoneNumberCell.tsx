import {CellPhoneMobileDevice, ChecklistCell} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {
  contactRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistContactDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {contactRevealed} from '../../../../../state/tradeChecklist/utils/contact'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {revealContactWithUiFeedbackAtom} from '../../../atoms/revealContactAtoms'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function RevealPhoneNumberCell(): React.ReactElement {
  const {t} = useTranslation()
  const identityRevealed = useAtomValue(identityRevealedAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('REVEAL_PHONE_NUMBER'), [])
  )
  const tradeChecklistContactData = useAtomValue(tradeChecklistContactDataAtom)
  const contactRevealTriggeredFromChat = useAtomValue(
    contactRevealTriggeredFromChatAtom
  )
  const phoneNumberRevealed = contactRevealed(tradeChecklistContactData)

  const disabled = useMemo(() => {
    const revealContactAlreadySent =
      tradeChecklistContactData.sent && !tradeChecklistContactData.received

    return Boolean(revealContactAlreadySent)
  }, [tradeChecklistContactData.received, tradeChecklistContactData.sent])

  if (!identityRevealed || contactRevealTriggeredFromChat) return <></>

  return (
    <ChecklistCell
      icon={CellPhoneMobileDevice}
      disabled={disabled}
      state={
        phoneNumberRevealed
          ? 'completed'
          : mapTradeChecklistItemStatusToUiState(itemStatus)
      }
      pressable={!phoneNumberRevealed}
      onPress={() => {
        void revealContact()()
      }}
      headline={t('tradeChecklist.options.REVEAL_PHONE_NUMBER')}
    />
  )
}

export default RevealPhoneNumberCell

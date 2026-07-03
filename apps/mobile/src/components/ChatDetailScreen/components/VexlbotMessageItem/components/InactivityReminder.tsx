import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {Button} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {dismissInactivityReminderActionAtom} from '../../../../../state/chat/atoms/dismissInactivityReminderActionAtom'
import focusChatByInboxKeyAndSenderKey from '../../../../../state/chat/atoms/focusChatByInboxKeyAndSenderKey'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {deleteChatFromListActionAtom} from '../../../../InsideRouter/components/MessagesScreen/atoms'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

function InactivityReminder({
  messageId,
}: {
  messageId: ChatMessageId
}): React.ReactElement {
  const {t} = useTranslation()
  const {chatAtom} = useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)
  const deleteChatFromList = useSetAtom(deleteChatFromListActionAtom)
  const dismissInactivityReminder = useSetAtom(
    dismissInactivityReminderActionAtom
  )

  const otherSideKey = chat.otherSide.publicKey
  const inboxKey = chat.inbox.privateKey.publicKeyPemBase64

  const focusedChatAtom = useMemo(
    () => focusChatByInboxKeyAndSenderKey({inboxKey, senderKey: otherSideKey}),
    [inboxKey, otherSideKey]
  )

  return (
    <VexlbotActionCard
      title={t('messages.inactivityReminder.title')}
      description={t('messages.inactivityReminder.subtitle')}
      onClosePress={() => {
        dismissInactivityReminder({chatAtom: focusedChatAtom, messageId})
      }}
    >
      <Button
        variant="destructive"
        size="medium"
        width="100%"
        onPress={() => {
          void deleteChatFromList({
            otherSideKey,
            inboxKey,
            skipAsk: false,
          })
        }}
      >
        {t('messages.deleteConversation')}
      </Button>
    </VexlbotActionCard>
  )
}

export default InactivityReminder

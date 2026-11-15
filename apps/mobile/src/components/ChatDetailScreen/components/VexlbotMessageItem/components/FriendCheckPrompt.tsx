import {Button} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Schema} from 'effect'
import {useAtom, useAtomValue} from 'jotai'
import React, {useMemo, useState} from 'react'
import {showFriendCheckPromptAtom} from '../../../../../state/chat/atoms/showFriendCheckPromptAtom'
import {ChatTransientMessageId} from '../../../../../state/chat/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import useOpenFriendCheck from '../../useOpenFriendCheck'
import DontShowAgainCheckbox from './DontShowAgainCheckbox'
import VexlbotActionCard from './VexlbotActionCard'

const PROMPT_ID = Schema.decodeSync(ChatTransientMessageId)('friendCheckPrompt')

export default function FriendCheckPrompt(): React.ReactElement | null {
  const {t} = useTranslation()
  const {createHideMessageAtom, friendCheckAvailableAtom, friendChecksAtom} =
    useMolecule(chatMolecule)
  const friendCheckAvailable = useAtomValue(friendCheckAvailableAtom)
  const friendChecks = useAtomValue(friendChecksAtom)
  const [showPrompt, setShowPrompt] = useAtom(showFriendCheckPromptAtom)
  const [hiddenInThisChat, setHiddenInThisChat] = useAtom(
    useMemo(() => createHideMessageAtom(PROMPT_ID), [createHideMessageAtom])
  )
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const openFriendCheck = useOpenFriendCheck()

  if (
    !friendCheckAvailable ||
    !showPrompt ||
    hiddenInThisChat ||
    Array.isNonEmptyReadonlyArray(friendChecks)
  )
    return null

  return (
    <VexlbotActionCard
      mt="$2"
      title={t('tradeChecklist.friendCheck.prompt.title')}
      description={t('tradeChecklist.friendCheck.prompt.description')}
      onClosePress={() => {
        setHiddenInThisChat(true)
        if (dontShowAgain) setShowPrompt(false)
      }}
    >
      <Button onPress={openFriendCheck} size="medium" variant="primary">
        {t('tradeChecklist.friendCheck.title')}
      </Button>
      <DontShowAgainCheckbox
        checked={dontShowAgain}
        onChange={setDontShowAgain}
      />
    </VexlbotActionCard>
  )
}

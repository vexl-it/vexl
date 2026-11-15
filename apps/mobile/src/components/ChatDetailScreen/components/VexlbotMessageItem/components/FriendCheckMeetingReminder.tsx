import {useMolecule} from 'bunshi/dist/react'
import {Schema} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {ChatTransientMessageId} from '../../../../../state/chat/domain'
import {hasFriendVouched} from '../../../../../state/tradeChecklist/utils/friendCheck'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import useOpenFriendCheck from '../../useOpenFriendCheck'
import VexlbotActionCard from './VexlbotActionCard'

const REMINDER_ID = Schema.decodeSync(ChatTransientMessageId)(
  'friendCheckMeetingReminder'
)

export default function FriendCheckMeetingReminder(): React.ReactElement | null {
  const {t} = useTranslation()
  const {friendCheckAvailableAtom, friendChecksAtom} = useMolecule(chatMolecule)
  const friendCheckAvailable = useAtomValue(friendCheckAvailableAtom)
  const friendChecks = useAtomValue(friendChecksAtom)
  const openFriendCheck = useOpenFriendCheck()

  if (!friendCheckAvailable || hasFriendVouched(friendChecks)) return null

  return (
    <VexlbotActionCard
      mt="$2"
      managedHidingId={REMINDER_ID}
      title={t('tradeChecklist.friendCheck.meetingReminder.title')}
      description={t('tradeChecklist.friendCheck.meetingReminder.description')}
      buttonText={t('tradeChecklist.friendCheck.title')}
      onPress={openFriendCheck}
    />
  )
}

import {useMolecule} from 'bunshi/dist/react'
import {Schema} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {ChatTransientMessageId} from '../../../../../state/chat/domain'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import useOpenFriendCheck from '../../useOpenFriendCheck'
import VexlbotActionCard from './VexlbotActionCard'

type Kind = 'afterReveal' | 'beforeMeeting'

const CARD_IDS = {
  afterReveal: Schema.decodeSync(ChatTransientMessageId)('friendCheckUnlocked'),
  beforeMeeting: Schema.decodeSync(ChatTransientMessageId)(
    'friendCheckMeetingReminder'
  ),
} satisfies Record<Kind, ChatTransientMessageId>

function copy(
  kind: Kind,
  nickname: string | undefined,
  t: TFunction
): {title: string; description: string} {
  if (kind === 'afterReveal')
    return {
      title: nickname
        ? t('tradeChecklist.friendCheck.afterReveal.title', {name: nickname})
        : t('tradeChecklist.friendCheck.afterReveal.titleUnnamed'),
      description: t('tradeChecklist.friendCheck.afterReveal.description'),
    }

  return {
    title: t('tradeChecklist.friendCheck.prompt.title'),
    description: nickname
      ? t('tradeChecklist.friendCheck.beforeMeeting.description', {
          name: nickname,
        })
      : t('tradeChecklist.friendCheck.beforeMeeting.descriptionUnnamed'),
  }
}

export default function FriendCheckSuggestion({
  kind,
}: {
  readonly kind: Kind
}): React.ReactElement | null {
  const {t} = useTranslation()
  const {chatAtom, friendCheckAvailableAtom} = useMolecule(chatMolecule)
  const friendCheckAvailable = useAtomValue(friendCheckAvailableAtom)
  const nickname = useAtomValue(chatAtom).otherSide.realLifeInfo?.userName
  const openFriendCheck = useOpenFriendCheck()

  if (!friendCheckAvailable) return null

  return (
    <VexlbotActionCard
      mt="$2"
      managedHidingId={CARD_IDS[kind]}
      {...copy(kind, nickname, t)}
      buttonText={t('tradeChecklist.friendCheck.title')}
      onPress={openFriendCheck}
    />
  )
}

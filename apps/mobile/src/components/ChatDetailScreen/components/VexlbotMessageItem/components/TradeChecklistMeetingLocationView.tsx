import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useStore} from 'jotai'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function getTextForVexlbot({
  by,
  otherSideUsername,
  note,
  address,
  t,
}: {
  by: 'me' | 'them'
  otherSideUsername: string
  address: string
  note?: string
  t: TFunction
}): string {
  return `${
    by === 'me'
      ? t('tradeChecklist.location.youSetMeetingLocation')
      : t('tradeChecklist.location.themSetMeetingLocation', {
          them: otherSideUsername,
        })
  } \n${address}${note ? `\n${note}` : ''}`
}

export default function TradeChecklistMeetingLocationView(): JSX.Element | null {
  const {t} = useTranslation()
  const {tradeChecklistMeetingLocationAtom, otherSideDataAtom, chatAtom} =
    useMolecule(chatMolecule)
  const meetingLocationData = useAtomValue(tradeChecklistMeetingLocationAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const store = useStore()
  const navigation = useNavigation()

  const agreedOn = MeetingLocation.getAgreed(meetingLocationData)
  if (agreedOn) {
    return (
      <VexlbotBubble
        status="accepted"
        text={getTextForVexlbot({
          by: agreedOn.by,
          address: agreedOn.data.data.address,
          note: agreedOn.data.data.note,
          otherSideUsername: otherSideData.userName,
          t,
        })}
      />
    )
  }

  const pendingSuggestion =
    MeetingLocation.getPendingSuggestion(meetingLocationData)
  if (pendingSuggestion) {
    return (
      <VexlbotBubble
        status="pending"
        text={getTextForVexlbot({
          by: pendingSuggestion.by,
          address: pendingSuggestion.data.data.address,
          note: pendingSuggestion.data.data.note,
          otherSideUsername: otherSideData.userName,
          t,
        })}
      >
        {pendingSuggestion.by === 'them' && (
          <Button
            onPress={() => {
              const chat = store.get(chatAtom)
              navigation.navigate('TradeChecklistFlow', {
                chatId: chat.id,
                inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
                screen: 'LocationMapPreview',
                params: {
                  selectedLocation: pendingSuggestion.data.data,
                  submitUpdateOnPick: true,
                },
              })
            }}
            variant="secondary"
            size="small"
            text={t('common.respond')}
          />
        )}
      </VexlbotBubble>
    )
  }

  return null
}

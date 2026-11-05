import {ChatEventCard} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {ProfileImageAvatar} from '../../ProfileImageAvatar'
import {chatMolecule} from '../atoms'
import {type MessagesListItem} from '../utils/buildMessagesListData'
import {LastMessageTime} from './LastMessageTime'
import TextMessage from './TextMessage'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

export function DisapproveMessagingMessage({
  itemAtom,
}: {
  itemAtom: Atom<MessagesListItem>
}): React.ReactElement | null {
  const {otherSideDataAtom, canBeRerequestedAtom} = useMolecule(chatMolecule)
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {image} = useAtomValue(otherSideDataAtom)
  const item = useAtomValue(itemAtom)
  const rerequestInfo = useAtomValue(canBeRerequestedAtom)

  if (item.type !== 'message') return null

  const direction = item.message.state === 'received' ? 'incoming' : 'outgoing'

  const resendText = rerequestInfo.canBeRerequested
    ? t('offer.canSendAgain')
    : rerequestInfo.possibleInDays != null && rerequestInfo.possibleInDays > 1
      ? t('offer.canSendAgainDays', {
          days: formatInteger(rerequestInfo.possibleInDays, locale),
        })
      : t('offer.canSendAgainTomorrow')

  return (
    <>
      <TextMessage hideLastMessageTime messageAtom={itemAtom} />
      <ChatEventCard
        mt="$4"
        mx="$4"
        image={<ProfileImageAvatar image={image} size="medium" grayscale />}
        description={
          direction === 'incoming'
            ? t('messages.themDeclined')
            : t('messages.youDeclined')
        }
      />
      <LastMessageTime message={item.message} />
      {direction === 'incoming' && (
        <VexlbotActionCard
          title={t('messages.offerWasDeclined')}
          description={`${t('messages.offerDeclinedDescripton')} ${resendText}`}
        />
      )}
    </>
  )
}

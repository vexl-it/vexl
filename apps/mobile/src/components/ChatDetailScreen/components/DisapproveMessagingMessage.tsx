import {Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import UserAvatar from '../../UserAvatar'
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
      <YStack
        backgroundColor="$backgroundSecondary"
        borderRadius="$5"
        mt="$4"
        py="$5"
        gap="$3"
        mx="$5"
        alignItems="center"
      >
        <UserAvatar height={48} width={48} userImage={image} grayScale={true} />
        <Typography color="$foregroundSecondary" variant="micro">
          {direction === 'incoming'
            ? t('messages.themDeclined')
            : t('messages.youDeclined')}
        </Typography>
      </YStack>
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

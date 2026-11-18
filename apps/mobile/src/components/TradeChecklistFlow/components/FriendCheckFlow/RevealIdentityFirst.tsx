import {
  ChecklistCell,
  EyeShut,
  InfoCircle,
  PeopleUsers,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {prepareExchangeDetailsDraftActionAtom} from '../../atoms/exchangeDetailsAtoms'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'

export default function RevealIdentityFirst({
  navigation,
}: {
  readonly navigation: TradeChecklistStackScreenProps<'FriendCheck'>['navigation']
}): React.ReactElement {
  const {t} = useTranslation()
  const prepareDraft = useSetAtom(prepareExchangeDetailsDraftActionAtom)

  const points = [
    {
      icon: EyeShut,
      headline: t('tradeChecklist.friendCheck.revealFirst.revealTitle'),
      subtitle: t('tradeChecklist.friendCheck.revealFirst.revealDescription'),
    },
    {
      icon: PeopleUsers,
      headline: t('tradeChecklist.friendCheck.revealFirst.askTitle'),
      subtitle: t('tradeChecklist.friendCheck.revealFirst.askDescription'),
    },
    {
      icon: InfoCircle,
      headline: t('tradeChecklist.friendCheck.revealFirst.privateTitle'),
      subtitle: t('tradeChecklist.friendCheck.revealFirst.privateDescription'),
    },
  ]

  return (
    <TradeChecklistItemPageLayout
      header={{title: ''}}
      bottomButton={{
        disabled: false,
        text: t('tradeChecklist.exchangeDetails.title'),
        onPress: () => {
          prepareDraft()
          navigation.navigate('ExchangeDetails')
        },
      }}
    >
      <YStack gap="$6">
        <YStack gap="$3">
          <Typography variant="heading3" color="$foregroundPrimary">
            {t('tradeChecklist.friendCheck.revealFirst.title')}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {t('tradeChecklist.friendCheck.revealFirst.description')}
          </Typography>
        </YStack>
        <YStack gap="$2">
          {pipe(
            points,
            Array.map((point) => (
              <ChecklistCell
                key={point.headline}
                state="initial"
                pressable={false}
                subtitleNumberOfLines={0}
                {...point}
              />
            ))
          )}
        </YStack>
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

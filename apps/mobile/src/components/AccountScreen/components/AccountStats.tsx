import {useNavigation} from '@react-navigation/native'
import {Button, tokens, Typography, XStack, YStack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {useWindowDimensions} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {
  closedChatsAtom,
  postedOffersAtom,
} from '../../../state/accountStatsAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'

const STACKED_LAYOUT_BREAKPOINT = 360

interface StatsCardProps {
  readonly label: string
  readonly value: string
  readonly buttonLabel: string
  readonly onPress: () => void
}

function StatsCard({
  label,
  value,
  buttonLabel,
  onPress,
}: StatsCardProps): React.ReactElement {
  return (
    <YStack
      flex={1}
      minWidth={tokens.size[13].val + tokens.size[10].val}
      gap="$5"
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      padding="$4"
    >
      <YStack gap="$3">
        <Typography
          variant="description"
          color="$foregroundSecondary"
          letterSpacing={0}
        >
          {label}
        </Typography>
        <Typography
          variant="tabLargeBold"
          color="$foregroundPrimary"
          letterSpacing={0}
        >
          {value}
        </Typography>
      </YStack>
      <Button variant="secondary" size="small" onPress={onPress}>
        {buttonLabel}
      </Button>
    </YStack>
  )
}

export function AccountStats(): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'Account'>['navigation']>()
  const {width} = useWindowDimensions()
  const closedChats = useAtomValue(closedChatsAtom)
  const locale = useAtomValue(formattingLocaleAtom)
  const postedOffers = useAtomValue(postedOffersAtom)
  const stacked = width < STACKED_LAYOUT_BREAKPOINT

  const navigateToMarketplace = useCallback(() => {
    navigation.navigate('InsideTabs', {screen: 'Marketplace'})
  }, [navigation])

  const navigateToCreateOffer = useCallback(() => {
    navigation.navigate('CRUDOfferFlow')
  }, [navigation])

  return (
    <XStack flexDirection={stacked ? 'column' : 'row'} gap="$4">
      <StatsCard
        label={t('account.stats.closed')}
        value={t('account.stats.dealsCountFormatted', {
          localizedString: formatInteger(closedChats, locale),
        })}
        buttonLabel={t('account.stats.exploreMarket')}
        onPress={navigateToMarketplace}
      />
      <StatsCard
        label={t('account.stats.posted')}
        value={t('account.stats.dealsCountFormatted', {
          localizedString: formatInteger(postedOffers, locale),
        })}
        buttonLabel={t('account.stats.postOffer')}
        onPress={navigateToCreateOffer}
      />
    </XStack>
  )
}

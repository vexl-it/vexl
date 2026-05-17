import {
  Snowflake,
  Typography,
  UserProfile,
  useTheme,
  XStack,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {AnimatedLiveIndicator} from '../../AnimatedLiveIndicator'
import {tradePriceTypeAtom} from '../atoms'

interface Props extends React.ComponentProps<typeof XStack> {
  displayInGrayColor?: boolean
  neutralTextColor?: boolean
}

function PriceTypeIndicator({
  displayInGrayColor,
  neutralTextColor,
  ...props
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const iconColor = displayInGrayColor
    ? theme.foregroundSecondary.get()
    : !tradePriceType || tradePriceType === 'live'
      ? neutralTextColor
        ? theme.accentHighlightSecondary.get()
        : theme.accentYellowPrimary.get()
      : tradePriceType === 'frozen'
        ? theme.pinkForeground.get()
        : theme.greenForeground.get()
  const textColor = displayInGrayColor
    ? '$foregroundSecondary'
    : neutralTextColor
      ? '$foregroundPrimary'
      : !tradePriceType || tradePriceType === 'live'
        ? '$accentHighlightSecondary'
        : tradePriceType === 'frozen'
          ? '$pinkForeground'
          : '$greenForeground'

  return (
    <XStack ai="center" gap="$2" {...props}>
      {!tradePriceType || tradePriceType === 'live' ? (
        <AnimatedLiveIndicator
          color={
            displayInGrayColor
              ? '$foregroundSecondary'
              : neutralTextColor
                ? '$accentHighlightSecondary'
                : '$accentYellowPrimary'
          }
        />
      ) : tradePriceType === 'frozen' ? (
        <Snowflake size={16} color={iconColor} />
      ) : (
        <UserProfile size={16} color={iconColor} />
      )}
      <Typography variant="paragraphSmall" color={textColor}>
        {!tradePriceType || tradePriceType === 'live'
          ? t('tradeCalculator.liveMarketPrice')
          : tradePriceType === 'frozen'
            ? t('tradeChecklist.calculateAmount.frozenPrice')
            : tradePriceType === 'custom'
              ? t('tradeChecklist.calculateAmount.customPrice')
              : t('tradeChecklist.calculateAmount.yourPrice')}
      </Typography>
    </XStack>
  )
}

export default PriceTypeIndicator

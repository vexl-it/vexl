import {Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTheme, XStack, type XStackProps} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {AnimatedLiveIndicator} from '../../AnimatedLiveIndicator'
import Image from '../../Image'
import userSvg from '../../images/userSvg'
import {tradePriceTypeAtom} from '../atoms'
import snowflakeSvg from '../images/snowflakeSvg'

interface Props extends XStackProps {
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
    ? theme.foregroundSecondary.val
    : !tradePriceType || tradePriceType === 'live'
      ? neutralTextColor
        ? theme.accentHighlightSecondary.val
        : theme.accentYellowPrimary.val
      : tradePriceType === 'frozen'
        ? theme.pinkForeground.val
        : theme.greenForeground.val
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
        <Image height={16} width={16} source={snowflakeSvg} fill={iconColor} />
      ) : (
        <Image height={16} width={16} source={userSvg} stroke={iconColor} />
      )}
      <Typography variant="paragraphSmall" color={textColor}>
        {!tradePriceType || tradePriceType === 'live'
          ? t('tradeChecklist.calculateAmount.livePrice')
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

import {useAtomValue} from 'jotai'
import React from 'react'
import {getTokens, Text, XStack, type XStackProps} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {AnimatedLiveIndicator} from '../../AnimatedLiveIndicator'
import Image from '../../Image'
import userSvg from '../../images/userSvg'
import {tradePriceTypeAtom} from '../atoms'
import snowflakeSvg from '../images/snowflakeSvg'

interface Props extends XStackProps {
  displayInGrayColor?: boolean
}

function PriceTypeIndicator({
  displayInGrayColor,
  ...props
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  return (
    <XStack ai="center" gap="$2" {...props}>
      {!tradePriceType || tradePriceType === 'live' ? (
        <AnimatedLiveIndicator
          color={displayInGrayColor ? '$greyOnBlack' : '$main'}
        />
      ) : tradePriceType === 'frozen' ? (
        <Image
          height={16}
          width={16}
          source={snowflakeSvg}
          fill={
            displayInGrayColor
              ? getTokens().color.greyOnBlack.val
              : getTokens().color.pink.val
          }
        />
      ) : (
        <Image
          height={16}
          width={16}
          source={userSvg}
          stroke={
            displayInGrayColor
              ? getTokens().color.greyOnBlack.val
              : getTokens().color.green.val
          }
        />
      )}
      <Text
        fos={16}
        ff="$body500"
        col={
          displayInGrayColor
            ? '$greyOnBlack'
            : !tradePriceType || tradePriceType === 'live'
              ? '$main'
              : tradePriceType === 'frozen'
                ? '$pink'
                : '$green'
        }
      >
        {!tradePriceType || tradePriceType === 'live'
          ? t('tradeChecklist.calculateAmount.livePrice')
          : tradePriceType === 'frozen'
            ? t('tradeChecklist.calculateAmount.frozenPrice')
            : tradePriceType === 'custom'
              ? t('tradeChecklist.calculateAmount.customPrice')
              : t('tradeChecklist.calculateAmount.yourPrice')}
      </Text>
    </XStack>
  )
}

export default PriceTypeIndicator

import {useAtomValue} from 'jotai'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {
  Stack,
  Text,
  XStack,
  getTokens,
  type ColorTokens,
  type StackProps,
} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import userSvg from '../../images/userSvg'
import {tradePriceTypeAtom} from '../atoms'
import snowflakeSvg from '../images/snowflakeSvg'

interface AnimatedLiveIndicatorProps {
  color?: ColorTokens
}

function AnimatedLiveIndicator({
  color,
}: AnimatedLiveIndicatorProps): JSX.Element {
  const opacity = useSharedValue(0)

  opacity.value = withRepeat(
    withTiming(1, {
      duration: 1000,
      easing: Easing.ease,
    }),
    -1,
    true
  )

  const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}), [])

  return (
    <Animated.View style={animatedStyle}>
      <Stack h={8} w={8} bc={color} br="$5" />
    </Animated.View>
  )
}

interface Props extends StackProps {
  displayInGrayColor?: boolean
}

function PriceTypeIndicator({
  displayInGrayColor,
  ...props
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  return (
    <XStack ai="center" space="$2" {...props}>
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
            : tradePriceType === 'live'
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

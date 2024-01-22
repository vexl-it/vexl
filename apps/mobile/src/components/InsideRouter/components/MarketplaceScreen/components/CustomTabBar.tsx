import {type MaterialTopTabBarProps} from '@react-navigation/material-top-tabs'
import {StyleSheet, TouchableOpacity, useWindowDimensions} from 'react-native'
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from '../../ContainerWithTopBorderRadius'

const SELL_TAB_INDEX = 0
const BUY_TAB_INDEX = 1

interface TabTitleProps {
  active: boolean
  onPress: () => void
  title: string
}

function Tab({active, onPress, title}: TabTitleProps): JSX.Element {
  return (
    <Stack
      f={1}
      ai="center"
      jc="center"
      mt={CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING}
      px="$2"
      pb="$2"
    >
      <TouchableOpacity onPress={onPress}>
        <Text
          col={active ? '$main' : '$greyOnBlack'}
          fos={40}
          ff="$heading"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Stack>
  )
}

const styles = StyleSheet.create({
  line: {
    height: '100%',
    width: '50%',
    borderRadius: 10,
    backgroundColor: getTokens().color.main.val,
  },
})

function AnimatedLine({isLeft}: {isLeft: boolean}): JSX.Element {
  const {width} = useWindowDimensions()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: withTiming(isLeft ? 0 : width / 2, {duration: 250})},
    ],
  }))

  return <Animated.View style={[styles.line, animatedStyle]} />
}

function CustomTabBar(props: MaterialTopTabBarProps): JSX.Element {
  const {t} = useTranslation()
  const {navigation} = props

  return (
    <Stack>
      <XStack ai="center" jc="space-around">
        <Tab
          active={navigation.getState().index === SELL_TAB_INDEX}
          onPress={() => {
            navigation.navigate('Sell')
          }}
          title={t('offer.sell')}
        />
        <Tab
          active={navigation.getState().index === BUY_TAB_INDEX}
          onPress={() => {
            navigation.navigate('Buy')
          }}
          title={t('offer.buy')}
        />
      </XStack>
      <Stack height={2} bc="$grey">
        <AnimatedLine isLeft={navigation.getState().index === SELL_TAB_INDEX} />
      </Stack>
    </Stack>
  )
}

export default CustomTabBar

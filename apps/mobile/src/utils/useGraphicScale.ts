import {useWindowDimensions} from 'react-native'
import {getTokens} from 'tamagui'

/** Scale factor that fits a graphic of `baseWidth` between the screen's horizontal paddings, never upscaling. */
export default function useGraphicScale(baseWidth: number): number {
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 2 * getTokens().space.$5.val
  return Math.min(1, availableWidth / baseWidth)
}

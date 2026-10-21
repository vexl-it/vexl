import React, {useCallback, useState} from 'react'
import Svg, {Circle, G, Path, Rect} from 'react-native-svg'

import {AnimatedSvgPart} from './AnimatedSvgPart'
import {useResolvedGraphicVariant} from './useResolvedGraphicVariant'

interface Props {
  readonly variant?: 'dark' | 'light'
  readonly width?: number
  readonly height?: number
  readonly animate?: boolean
  readonly disableReplayOnPress?: boolean
}

function Glasses({
  centerX,
  centerY,
  lensShadeColor,
}: {
  readonly centerX: number
  readonly centerY: number
  readonly lensShadeColor: string
}): React.JSX.Element {
  // prettier-ignore
  return (<G transform={`translate(${centerX - 134.125} ${centerY - 144.08})`}><Path d="M101.119 141.748H167.131V146.421H101.119V141.748Z" fill="black" /><Path d="M128.389 154.411C128.389 154.411 123.766 149.788 118.062 144.085C112.359 138.381 107.736 133.758 107.736 133.758C113.439 128.054 122.686 128.054 128.389 133.758C134.093 139.461 134.093 148.708 128.389 154.411Z" fill={lensShadeColor} /><Path d="M128.388 154.411C122.685 160.115 113.438 160.115 107.734 154.411C102.031 148.708 102.031 139.461 107.734 133.758C107.734 133.758 112.358 138.381 118.061 144.085C123.765 149.788 128.388 154.411 128.388 154.411Z" fill="black" /><Path d="M160.518 154.411C160.518 154.411 155.895 149.788 150.191 144.085C144.488 138.381 139.865 133.758 139.865 133.758C145.568 128.054 154.815 128.054 160.518 133.758C166.222 139.461 166.222 148.708 160.518 154.411Z" fill={lensShadeColor} /><Path d="M160.517 154.411C154.814 160.115 145.567 160.115 139.863 154.411C134.16 148.708 134.16 139.461 139.863 133.758C139.863 133.758 144.487 138.381 150.19 144.085C155.893 149.788 160.517 154.411 160.517 154.411Z" fill="black" /><Rect width="4.44" height="0.6" fill="black" transform="translate(132.678, 145.8)" /></G>)
}

export function UsageStatisticsGraphic({
  variant,
  width = 264,
  height = 188,
  animate = false,
  disableReplayOnPress = false,
}: Props): React.JSX.Element {
  const isDark = useResolvedGraphicVariant(variant) === 'dark'
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const retriggerAnimation = useCallback(() => {
    if (animate) setAnimationTrigger((current) => current + 1)
  }, [animate])

  const darkGreen = isDark ? '#5D9169' : '#3D4D41'
  const lightGreen = isDark ? '#ADE2B9' : '#ACD9B7'
  const yellow = isDark ? '#FCCD6C' : '#F8C471'
  const pink = isDark ? '#FCC5F3' : '#F6BAEC'
  const lensShade = isDark ? '#666666' : '#333333'

  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 264 188" fill="none" onPress={animate && !disableReplayOnPress ? retriggerAnimation : undefined}><AnimatedSvgPart animate={animate} index={0} trigger={animationTrigger} originX={48} originY={188}><Path d="M20 132H76V188H20V132Z" fill={lightGreen} /><Path d="M20 132C20 116.536 32.536 104 48 104C63.464 104 76 116.536 76 132H20Z" fill={darkGreen} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={1} trigger={animationTrigger} originX={116} originY={188}><Path d="M88 92H144V188H88V92Z" fill={yellow} /><Path d="M88 92L144 36V92H88Z" fill={pink} /><Path d="M88 188V160C103.464 160 116 172.536 116 188H88Z" fill={darkGreen} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={2} trigger={animationTrigger} originX={200} originY={188}><Path d="M156 188V60C156 37.909 173.909 20 196 20H204C226.091 20 244 37.909 244 60V188H156Z" fill={pink} /><Path d="M172 188C172 172.536 184.536 160 200 160C215.464 160 228 172.536 228 188H172Z" fill={lightGreen} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={3} trigger={animationTrigger} originX={200} originY={84}><Glasses centerX={200} centerY={84} lensShadeColor={lensShade} /></AnimatedSvgPart><AnimatedSvgPart animate={animate} index={4} trigger={animationTrigger} originX={72} originY={36}><Circle cx="40" cy="56" r="14" fill={yellow} /><Path d="M96 24H120V0L96 24Z" fill={darkGreen} /></AnimatedSvgPart></Svg>)
}

import React from 'react'
import Svg, {Circle, G, Path} from 'react-native-svg'

interface Props {
  readonly variant?: 'dark' | 'light'
  readonly width?: number
  readonly height?: number
}

export function FaqAnonymizationNotice({
  variant = 'light',
  width = 257,
  height = 256,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={width} height={height} viewBox="0 0 257 256" fill="none"><G transform="translate(47.75, 48.25) rotate(-90, 80.5, 80.5)"><Path d="M0 0L161 161H0V0Z" fill="black" /></G><G transform="translate(209, 209) rotate(90, 24, 24)"><Path opacity="0.7" d="M0 0L48 48H0V0Z" fill="black" /></G><G transform="translate(47.75, 48.25) rotate(90, 80.5, 80.5)"><Path d="M0 0L161 161H0V0Z" fill={variant === 'dark' ? "#6B6B6B" : "#333333"} /></G><G transform="translate(0, 0) rotate(-90, 24, 24)"><Path opacity="0.5" d="M0 0L48 48H0V0Z" fill={variant === 'dark' ? "#DBDBDB" : "#333333"} /></G><G transform="translate(73.04, 95.63)"><Path d="M110.405 33.1214C110.405 33.1214 100.576 33.1214 55.2024 33.1214C9.82605 33.1214 0 33.1214 0 33.1214C0 33.1214 19.8261 0 55.2024 0C90.5761 0 110.405 33.1214 110.405 33.1214Z" fill="white" /></G><G transform="translate(73.04, 128) rotate(180, 55.2025, 16.5605)"><Path d="M110.405 33.1214C110.405 33.1214 100.576 33.1214 55.2024 33.1214C9.82605 33.1214 0 33.1214 0 33.1214C0 33.1214 19.8261 0 55.2024 0C90.5761 0 110.405 33.1214 110.405 33.1214Z" fill="white" /></G><G transform="translate(90.8845, 105.195) rotate(135, 27.601, 13.8005)"><Path d="M27.6012 27.6012C42.8449 27.6012 55.2024 15.2437 55.2024 0L0 0C0 15.2437 12.3575 27.6012 27.6012 27.6012Z" fill="#A4D5AF" /></G><G transform="translate(110.40450000000001, 124.715) rotate(-45, 27.601, 13.8005)"><Path d="M27.6012 27.6012C42.8449 27.6012 55.2024 14.9628 55.2024 0H0C0 14.9628 12.3575 27.6012 27.6012 27.6012Z" fill="#82C492" /></G><G transform="translate(120.345, 64.465) rotate(45, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#FBA5EC" /></G><G transform="translate(120.345, 64.47500000000001) rotate(-135, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#FCC4F3" /></G><G transform="translate(120.345, 177.525) rotate(45, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#FCCD6C" /></G><G transform="translate(120.345, 177.525) rotate(-135, 8.075, 8.075)"><Path d="M0 0L16.1505 16.1505H0V0Z" fill="#EEB338" /></G><G transform="translate(120, 121)"><Circle cx="8" cy="8" r="8" fill="#101010" /></G></Svg>)
}

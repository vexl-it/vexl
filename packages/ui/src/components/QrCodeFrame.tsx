import React from 'react'
import type {ImageSourcePropType} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import {getTokens, useTheme} from 'tamagui'

import {Stack} from '../primitives'

export interface QrCodeSvgRef {
  readonly toDataURL: (callback: (url: string) => void) => void
}

export interface QrCodeFrameProps {
  readonly value: string
  /** Size of the QR code itself, without the white frame. */
  readonly size: number
  readonly logo?: ImageSourcePropType
  readonly ecl?: 'L' | 'M' | 'Q' | 'H'
  /** Content laid over the code, e.g. an expired status panel. */
  readonly overlay?: React.ReactNode
  readonly onPress?: () => void
  readonly getRef?: (ref: QrCodeSvgRef | null) => void
}

export function QrCodeFrame({
  value,
  size,
  logo,
  ecl,
  overlay,
  onPress,
  getRef,
}: QrCodeFrameProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <Stack
      alignSelf="center"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius="$3"
      padding="$1"
      backgroundColor="$white100"
      onPress={onPress}
    >
      <QRCode
        value={value}
        size={size}
        logo={logo}
        logoSize={getTokens().size.$11.val}
        logoBackgroundColor={theme.gradientHelper.get()}
        ecl={ecl}
        getRef={getRef}
      />
      {overlay}
    </Stack>
  )
}

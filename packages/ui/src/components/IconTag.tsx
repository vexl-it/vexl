import React from 'react'
import {styled, useTheme} from 'tamagui'

import {BoxProduct} from '../icons/BoxProduct'
import {CurrencyBitcoinCircle} from '../icons/CurrencyBitcoinCircle'
import {Tools} from '../icons/Tools'
import type {IconProps} from '../icons/types'
import {XStack} from '../primitives'

export type IconTagVariant = 'bitcoin' | 'product' | 'service'

const iconMap: Record<IconTagVariant, React.ComponentType<IconProps>> = {
  bitcoin: CurrencyBitcoinCircle,
  product: BoxProduct,
  service: Tools,
}

const IconTagFrame = styled(XStack, {
  name: 'IconTag',
  alignItems: 'center',
  overflow: 'hidden',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderTopLeftRadius: '$1',
  borderTopRightRadius: '$4',
  borderBottomLeftRadius: '$4',
  borderBottomRightRadius: '$1',

  variants: {
    variant: {
      bitcoin: {backgroundColor: '$accentYellowSecondary'},
      product: {backgroundColor: '$backgroundHighlight'},
      service: {backgroundColor: '$backgroundHighlight'},
    },
  } as const,
})

type IconTagFrameProps = React.ComponentProps<typeof IconTagFrame>

interface IconTagProps extends Omit<IconTagFrameProps, 'children' | 'variant'> {
  readonly variant: IconTagVariant
}

export function IconTag({variant, ...rest}: IconTagProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor =
    variant === 'bitcoin'
      ? theme.accentHighlightSecondary.val
      : theme.foregroundPrimary.val
  const Icon = iconMap[variant]

  return (
    <IconTagFrame variant={variant} {...rest}>
      <Icon color={iconColor} size={24} />
    </IconTagFrame>
  )
}

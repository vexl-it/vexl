import React from 'react'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {Stack, XStack} from '../primitives'
import {Typography} from './Typography'

const InfoPointFrame = styled(XStack, {
  name: 'InfoPoint',
  alignItems: 'center',
  gap: '$4',
})

const InfoPointIconBox = styled(Stack, {
  name: 'InfoPointIconBox',
  width: '$9',
  height: '$9',
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$backgroundSecondary',
})

export interface InfoPointProps {
  readonly icon: React.ComponentType<IconProps>
  readonly children: string
}

export function InfoPoint({
  icon: Icon,
  children,
}: InfoPointProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <InfoPointFrame>
      <InfoPointIconBox>
        <Icon color={theme.foregroundPrimary.get()} size={20} />
      </InfoPointIconBox>
      <Typography
        color="$foregroundSecondary"
        flex={1}
        variant="paragraphSmall"
      >
        {children}
      </Typography>
    </InfoPointFrame>
  )
}

import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack} from '../primitives'

const FabButtonFrame = styled(Stack, {
  name: 'FabButton',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$accentYellowPrimary',
  padding: '$5',
  gap: '$3',
  borderRadius: '$4',

  pressStyle: {
    opacity: 0.7,
  },
})

const FabButtonLabel = styled(SizableText, {
  name: 'FabButtonLabel',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$5',
  letterSpacing: '$5',
  color: '$black100',
})

type FabButtonFrameProps = React.ComponentProps<typeof FabButtonFrame>

interface FabButtonProps extends Omit<FabButtonFrameProps, 'children'> {
  readonly icon: React.ReactNode
  readonly children: string
}

export function FabButton({
  icon,
  children,
  ...rest
}: FabButtonProps): React.JSX.Element {
  return (
    <FabButtonFrame {...rest}>
      {icon}
      <FabButtonLabel>{children}</FabButtonLabel>
    </FabButtonFrame>
  )
}

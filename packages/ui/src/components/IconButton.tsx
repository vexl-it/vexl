import React from 'react'
import {styled} from 'tamagui'

import {Stack} from '../primitives'
import {Dot} from './Dot'

const IconButtonFrame = styled(Stack, {
  name: 'IconButton',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  width: '$10',
  height: '$10',
  padding: '$4',
  borderRadius: '$3',
  backgroundColor: '$backgroundSecondary',
  overflow: 'visible',

  pressStyle: {
    opacity: 0.7,
  },
})

type IconButtonFrameProps = React.ComponentProps<typeof IconButtonFrame>

interface IconButtonProps extends IconButtonFrameProps {
  readonly showBadge?: boolean
}

export function IconButton({
  children,
  showBadge = false,
  ...rest
}: IconButtonProps): React.JSX.Element {
  return (
    <IconButtonFrame {...rest}>
      {children}
      {showBadge ? (
        <Dot
          position="absolute"
          top="$-2"
          right="$-2"
          size="$5"
          backgroundColor="$accentYellowPrimary"
        />
      ) : null}
    </IconButtonFrame>
  )
}

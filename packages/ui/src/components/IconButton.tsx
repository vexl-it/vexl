import React from 'react'
import {styled} from 'tamagui'

import {Circle, Stack} from '../primitives'

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

const IconButtonBadge = styled(Circle, {
  name: 'IconButtonBadge',
  position: 'absolute',
  top: '$-2',
  right: '$-2',
  size: '$5',
  backgroundColor: '$accentYellowPrimary',
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
      {showBadge ? <IconButtonBadge /> : null}
    </IconButtonFrame>
  )
}

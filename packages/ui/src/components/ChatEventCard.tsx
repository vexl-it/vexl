import React from 'react'
import {styled} from 'tamagui'

import {Stack, YStack} from '../primitives'
import {Typography} from './Typography'

const ChatEventCardFrame = styled(YStack, {
  name: 'ChatEventCard',
  alignItems: 'center',
  gap: '$2',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',
})

export interface ChatEventCardProps extends Omit<
  React.ComponentProps<typeof ChatEventCardFrame>,
  'children'
> {
  readonly image?: React.ReactNode
  readonly title?: string
  readonly description?: string
}

export function ChatEventCard({
  image,
  title,
  description,
  ...rest
}: ChatEventCardProps): React.JSX.Element {
  return (
    <ChatEventCardFrame {...rest}>
      {image ? <Stack marginBottom="$3">{image}</Stack> : null}
      {title ? (
        <Typography
          textAlign="center"
          variant="paragraphSmallBold"
          color="$foregroundPrimary"
        >
          {title}
        </Typography>
      ) : null}
      {description ? (
        <Typography
          textAlign="center"
          variant="micro"
          color="$foregroundSecondary"
        >
          {description}
        </Typography>
      ) : null}
    </ChatEventCardFrame>
  )
}

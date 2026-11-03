import {
  AddUserPersonContact,
  Avatar,
  avatarsSvg,
  Button,
  ExchangeRevealCard,
  resolveSizePx,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const LeftAvatarSvg = avatarsSvg[3]
const RightAvatarSvg = avatarsSvg[7]
const avatarPx = resolveSizePx('$13')

function Demos(): React.JSX.Element {
  return (
    <ExchangeRevealCard
      title="Exchange complete"
      description="You both shared: phone number, photo"
      leftSide={{
        avatar: (
          <Avatar size="$13">
            {LeftAvatarSvg ? <LeftAvatarSvg size={avatarPx} /> : null}
          </Avatar>
        ),
        name: 'Me',
        subtitle: '+420 777 123 456',
      }}
      rightSide={{
        avatar: (
          <Avatar size="$13">
            {RightAvatarSvg ? <RightAvatarSvg size={avatarPx} /> : null}
          </Avatar>
        ),
        name: 'Satoshi',
        subtitle: '+420 608 987 654',
        onAvatarPress: () => {},
      }}
      footer={
        <Button
          icon={AddUserPersonContact}
          size="small"
          variant="tertiary"
          width="100%"
          onPress={() => {}}
        >
          Add to contacts
        </Button>
      }
    />
  )
}

export function ExchangeRevealCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Exchange Reveal Card" demos={Demos} />
}

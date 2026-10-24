import {
  AddUserPersonContact,
  Avatar,
  avatarsSvg,
  Button,
  RevealedInfoCard,
  revealedInfoCardAvatarSize,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const testAvatar = require('../assets/testAvatar.png')
const AnonymousAvatarSvg = avatarsSvg[1]

function AnonymousAvatar(): React.JSX.Element {
  return (
    <Avatar customSize={revealedInfoCardAvatarSize}>
      {AnonymousAvatarSvg ? (
        <AnonymousAvatarSvg size={revealedInfoCardAvatarSize} />
      ) : null}
    </Avatar>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <RevealedInfoCard
        title="Identity reveal complete"
        description="You both shared name, photo, phone number"
        leftSide={{
          avatar: (
            <Avatar
              customSize={revealedInfoCardAvatarSize}
              source={testAvatar}
            />
          ),
          name: 'Satoshi',
          phoneNumber: '+420 777 123 456',
        }}
        rightSide={{
          avatar: (
            <Avatar
              customSize={revealedInfoCardAvatarSize}
              source={testAvatar}
            />
          ),
          name: 'Hal',
          phoneNumber: '+420 608 987 654',
          onAvatarPress: () => {},
        }}
        action={
          <Button
            icon={AddUserPersonContact}
            size="small"
            variant="tertiary"
            width="100%"
          >
            Add to contacts
          </Button>
        }
      />
      <RevealedInfoCard
        title="Identity reveal complete"
        description={'They shared name\nYou shared name, photo'}
        leftSide={{
          avatar: (
            <Avatar
              customSize={revealedInfoCardAvatarSize}
              source={testAvatar}
            />
          ),
          name: 'Satoshi',
          phoneNumber: '+420 *** *** 456',
        }}
        rightSide={{
          avatar: <AnonymousAvatar />,
          name: 'Anonymous Hal',
          phoneNumber: '+420 *** *** 654',
        }}
      />
    </YStack>
  )
}

export function RevealedInfoCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Revealed Info Card" demos={Demos} />
}

import {
  Avatar,
  CardButton,
  PersonRow,
  Switch,
  Typography,
  UserImagePlaceholder,
  YStack,
} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const testAvatar = require('../assets/testAvatar.png') as number
const switchAtom = atom(false)

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <Typography variant="micro" color="$foregroundSecondary">
        Medium (contact list)
      </Typography>
      <PersonRow
        avatar={<Avatar size="$9" source={testAvatar} />}
        title="Satoshi Nakamoto"
        subtitle="+420 777 123 456"
      />
      <PersonRow
        dimmed
        avatar={
          <Avatar size="$9">
            <UserImagePlaceholder size={40} borderRadius={0} grayscale />
          </Avatar>
        }
        title="Hal Finney"
        subtitle="+420 777 654 321"
        trailing={<Switch valueAtom={switchAtom} />}
      />
      <Typography variant="micro" color="$foregroundSecondary">
        Large with trailing actions
      </Typography>
      <PersonRow
        size="large"
        avatar={<Avatar size="$9" source={testAvatar} />}
        title="Satoshi Nakamoto"
        subtitle="+420 777 123 456"
        trailing={<CardButton contrast>Edit</CardButton>}
      />
      <Typography variant="micro" color="$foregroundSecondary">
        Framed (secondary / primary background)
      </Typography>
      <PersonRow
        size="large"
        background="secondary"
        avatar={<Avatar size="$9" source={testAvatar} />}
        title="Satoshi Nakamoto"
        subtitle="+420 777 123 456"
      />
      <YStack
        backgroundColor="$backgroundSecondary"
        padding="$3"
        borderRadius="$5"
      >
        <PersonRow
          background="primary"
          avatar={<Avatar size="$9" source={testAvatar} />}
          title="A very long contact name that should be truncated nicely"
          subtitle="+420 777 123 456"
        />
      </YStack>
    </YStack>
  )
}

export function PersonRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Person Row" demos={Demos} />
}

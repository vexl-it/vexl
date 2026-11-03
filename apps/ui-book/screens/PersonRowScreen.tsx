import {
  Avatar,
  CardButton,
  PersonRow,
  Switch,
  UserImagePlaceholder,
  YStack,
} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const testAvatar = require('../assets/testAvatar.png') as number
const switchAtom = atom(false)

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Medium (contact list)">
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
      </DemoSection>
      <DemoSection title="Large with trailing actions">
        <PersonRow
          size="large"
          avatar={<Avatar size="$9" source={testAvatar} />}
          title="Satoshi Nakamoto"
          subtitle="+420 777 123 456"
          trailing={<CardButton contrast>Edit</CardButton>}
        />
      </DemoSection>
      <DemoSection title="Framed (secondary / primary background)">
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
      </DemoSection>
    </>
  )
}

export function PersonRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Person Row" demos={Demos} />
}

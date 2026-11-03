import {Chip, XStack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <DemoSection title="Single chip">
        <Chip name="Marcel Mrkev" avatarSource={vexlAvatarSource} />
      </DemoSection>

      <DemoSection title="No avatar">
        <Chip name="Anonymous User" />
      </DemoSection>

      <DemoSection title="Long name (truncated)">
        <Chip
          name="Very Long Username That Should Truncate"
          avatarSource={vexlAvatarSource}
        />
      </DemoSection>

      <DemoSection title="Trusted">
        <Chip name="Jana" avatarSource={vexlAvatarSource} trusted />
        <Chip name="Petr" trusted />
        <XStack gap="$3" flexWrap="wrap">
          <Chip name="Jana" avatarSource={vexlAvatarSource} trusted />
          <Chip name="Petr" trusted />
          <Chip name="Alice" avatarSource={vexlAvatarSource} />
        </XStack>
      </DemoSection>

      <DemoSection title="Multiple chips in a row">
        <XStack gap="$3" flexWrap="wrap">
          <Chip name="Marcel" avatarSource={vexlAvatarSource} />
          <Chip name="Stepan" avatarSource={vexlAvatarSource} />
          <Chip name="Grafon" avatarSource={vexlAvatarSource} />
          <Chip name="Alice" avatarSource={vexlAvatarSource} />
        </XStack>
      </DemoSection>
    </YStack>
  )
}

export function ChipScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chip" demos={Demos} />
}

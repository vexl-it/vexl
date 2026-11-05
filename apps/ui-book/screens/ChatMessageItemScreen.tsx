import {
  Avatar,
  avatarsSvg,
  ChatMessageItem,
  EyeOpen,
  Rejected,
  SignOut,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AvatarSvg1 = avatarsSvg[0]!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AvatarSvg2 = avatarsSvg[1]!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AvatarSvg3 = avatarsSvg[2]!

function DemoAvatar(): React.JSX.Element {
  return (
    <Avatar size="small">
      <AvatarSvg1 size={32} />
    </Avatar>
  )
}

function DemoAvatar2(): React.JSX.Element {
  return (
    <Avatar size="small">
      <AvatarSvg2 size={32} />
    </Avatar>
  )
}

function DemoAvatar3(): React.JSX.Element {
  return (
    <Avatar size="small">
      <AvatarSvg3 size={32} />
    </Avatar>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <DemoSection title="Unread + highlighted">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="New request received"
          time="5:50 PM"
          unread
          variant="highlighted"
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="Reacted to your offer"
          time="5:50 PM"
          unread
          variant="highlighted"
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          message="Responded to your note"
          time="5:50 PM"
          unread
          variant="highlighted"
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar3 />}
          name="Direct friend"
          message="Updated trading checklist"
          time="5:50 PM"
          unread
          variant="highlighted"
        />
      </DemoSection>

      <DemoSection title="Regular messages">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="Hi, is this offer still active?"
          time="Tue"
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          message="You: Lorem ipsum dolor sit amet, consectetur adipiscing elit"
          time="Tue"
        />
      </DemoSection>

      <DemoSection title="Search result (highlightQuery)">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          highlightQuery="friend"
          message="Hi, is this offer still active?"
          time="2 hours ago"
        />
      </DemoSection>

      <DemoSection title="Typing">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="Last message before typing"
          time="4.11."
          isTyping
        />
      </DemoSection>

      <DemoSection title="Revealed (icon + success)">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          message="Identity revealed"
          time="4.11."
          variant="success"
          icon={EyeOpen}
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          message="Phone numbers revealed"
          time="4.11."
          variant="success"
          icon={EyeOpen}
        />
      </DemoSection>

      <DemoSection title="Declined (icon + destructive)">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="Declined to reveal identity"
          time="4.11."
          variant="destructive"
          icon={Rejected}
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="Declined to reveal phone number"
          time="4.11."
          variant="destructive"
          icon={Rejected}
        />
      </DemoSection>

      <DemoSection title="Destructive actions">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar3 />}
          name="Direct friend"
          message="Chat blocked"
          time="4.11."
          variant="destructive"
          grayscaleAvatar
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar3 />}
          name="Direct friend"
          message="Cancelled trade request"
          time="4.11."
          variant="destructive"
          icon={Rejected}
          grayscaleAvatar
        />
      </DemoSection>

      <DemoSection title="You: destructive">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="You: Cancel trade request"
          time="4.11."
          variant="destructive"
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="You: Request declined"
          time="4.11."
          variant="destructive"
        />
      </DemoSection>

      <DemoSection title="Deleted (icon + destructive)">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          message="Deleted offer"
          time="4.11."
          variant="destructive"
          icon={Rejected}
          grayscaleAvatar
        />
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar2 />}
          name="Direct friend"
          message="Deleted chat"
          time="4.11."
          variant="destructive"
          icon={Rejected}
          grayscaleAvatar
        />
      </DemoSection>

      <DemoSection title="Left the chat">
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar3 />}
          name="Direct friend"
          message="Left the chat"
          time="4.11."
          icon={SignOut}
        />
      </DemoSection>
    </YStack>
  )
}

export function ChatMessageItemScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Message Item" demos={Demos} />
}

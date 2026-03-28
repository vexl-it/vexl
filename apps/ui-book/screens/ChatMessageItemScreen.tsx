import {
  Avatar,
  avatarsSvg,
  ChatMessageItem,
  EyeOpen,
  Rejected,
  SignOut,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

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

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$2"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>Unread + highlighted</SectionLabel>
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

        <SectionLabel>Regular messages</SectionLabel>
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

        <SectionLabel>Typing</SectionLabel>
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar />}
          name="Direct friend"
          message="Last message before typing"
          time="4.11."
          isTyping
        />

        <SectionLabel>Revealed (icon + success)</SectionLabel>
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

        <SectionLabel>Declined (icon + destructive)</SectionLabel>
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

        <SectionLabel>Destructive actions</SectionLabel>
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

        <SectionLabel>You: destructive</SectionLabel>
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

        <SectionLabel>Deleted (icon + destructive)</SectionLabel>
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

        <SectionLabel>Left the chat</SectionLabel>
        <ChatMessageItem
          onPress={() => {}}
          avatar={<DemoAvatar3 />}
          name="Direct friend"
          message="Left the chat"
          time="4.11."
          icon={SignOut}
        />
      </YStack>
    </Theme>
  )
}

export function ChatMessageItemScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Chat Message Item
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

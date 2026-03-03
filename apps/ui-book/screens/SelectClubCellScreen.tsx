import {Avatar, SelectClubCell, SizableText, Theme, YStack} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'

const clubTestAvatar = require('../assets/clubTestAvatar.png') as number

const clubAvatar = <Avatar customSize={40} source={clubTestAvatar} />

function Section({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack gap="$3">
      <SizableText
        fontFamily="$body"
        fontWeight="600"
        fontSize="$5"
        letterSpacing="$5"
        color="$foregroundPrimary"
      >
        {title}
      </SizableText>
      {children}
    </YStack>
  )
}

function ClubList(): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  return (
    <YStack gap="$3">
      <SelectClubCell
        selected={selected.has('prague')}
        name="Bitcoin Prague"
        description="10 members"
        avatar={clubAvatar}
        onPress={() => {
          toggle('prague')
        }}
      />
      <SelectClubCell
        selected={selected.has('vienna')}
        name="Bitcoin Vienna"
        description="25 members"
        avatar={clubAvatar}
        onPress={() => {
          toggle('vienna')
        }}
      />
      <SelectClubCell
        selected={selected.has('berlin')}
        name="Bitcoin Berlin"
        description="8 members"
        avatar={clubAvatar}
        onPress={() => {
          toggle('berlin')
        }}
      />
    </YStack>
  )
}

function StaticDemos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <SelectClubCell
        name="Bitcoin Prague"
        description="10 members"
        avatar={clubAvatar}
      />
      <SelectClubCell
        selected
        name="Bitcoin Prague"
        description="10 members"
        avatar={clubAvatar}
      />
    </YStack>
  )
}

export function SelectClubCellScreen(): React.JSX.Element {
  return (
    <ScrollView>
      <YStack
        flex={1}
        padding="$5"
        gap="$7"
        backgroundColor="$backgroundPrimary"
      >
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          letterSpacing="$3"
          color="$foregroundPrimary"
        >
          SelectClubCell
        </SizableText>

        <Section title="Light">
          <StaticDemos />
        </Section>

        <Section title="Dark">
          <Theme name="dark">
            <YStack
              gap="$3"
              padding="$5"
              borderRadius="$5"
              backgroundColor="$backgroundPrimary"
            >
              <StaticDemos />
            </YStack>
          </Theme>
        </Section>

        <Section title="Multi-select list">
          <ClubList />
        </Section>

        <Section title="Multi-select list (dark)">
          <Theme name="dark">
            <YStack
              gap="$3"
              padding="$5"
              borderRadius="$5"
              backgroundColor="$backgroundPrimary"
            >
              <ClubList />
            </YStack>
          </Theme>
        </Section>
      </YStack>
    </ScrollView>
  )
}

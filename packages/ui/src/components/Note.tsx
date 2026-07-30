import React from 'react'
import {styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {SandWatch} from '../icons/SandWatch'
import {type IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {CardButton} from './CardButton'
import {Typography} from './Typography'

export interface NoteTag {
  readonly icon?: React.ComponentType<IconProps>
  readonly label: string
}

export interface NoteActionButton {
  readonly label: string
  readonly onPress: () => void
}

export interface NoteProps {
  readonly avatar: React.ReactNode
  readonly name?: string
  readonly commonFriends?: string
  readonly expiration: string
  readonly message: string
  readonly messageNumberOfLines?: number
  readonly tag?: NoteTag
  readonly onPress?: () => void
  readonly actionButton?: NoteActionButton
}

const CardFrame = styled(YStack, {
  name: 'Note',
  gap: '$0.5',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

const InformationFrame = styled(YStack, {
  name: 'NoteInformation',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
  gap: '$4',
})

const TagFrame = styled(XStack, {
  name: 'NoteTag',
  alignItems: 'center',
  gap: '$1',
})

const HeaderFrame = styled(XStack, {
  name: 'NoteHeader',
  alignItems: 'center',
  gap: '$3',
})

const ContentFrame = styled(YStack, {
  name: 'NoteContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
  gap: '$3',
})

export function Note({
  avatar,
  name,
  commonFriends,
  expiration,
  message,
  messageNumberOfLines,
  tag,
  onPress,
  actionButton,
}: NoteProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = theme.foregroundSecondary.get()
  const isPressable = !!onPress
  const TagIcon = tag?.icon

  return (
    <CardFrame pressable={isPressable} onPress={onPress}>
      <InformationFrame>
        {tag ? (
          <TagFrame>
            {TagIcon ? <TagIcon size={16} color={iconColor} /> : null}
            <Typography variant="micro" color="$foregroundSecondary">
              {tag.label}
            </Typography>
          </TagFrame>
        ) : null}
        <HeaderFrame>
          {avatar}
          <YStack gap="$1" flexShrink={1} flexGrow={1}>
            {name ? (
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {name}
              </Typography>
            ) : null}
            <XStack gap="$3" alignItems="center">
              {commonFriends ? (
                <XStack gap="$1" alignItems="center">
                  <PeopleUsers size={16} color={iconColor} />
                  <Typography variant="micro" color="$foregroundSecondary">
                    {commonFriends}
                  </Typography>
                </XStack>
              ) : null}
              <XStack gap="$1" alignItems="center">
                <SandWatch size={16} color={iconColor} />
                <Typography variant="micro" color="$foregroundSecondary">
                  {expiration}
                </Typography>
              </XStack>
            </XStack>
          </YStack>
        </HeaderFrame>
      </InformationFrame>
      <ContentFrame>
        <Typography
          variant="description"
          color="$foregroundSecondary"
          numberOfLines={messageNumberOfLines}
          ellipsizeMode={messageNumberOfLines ? 'tail' : undefined}
        >
          {message}
        </Typography>
        {actionButton ? (
          <CardButton contrast onPress={actionButton.onPress}>
            {actionButton.label}
          </CardButton>
        ) : null}
      </ContentFrame>
    </CardFrame>
  )
}

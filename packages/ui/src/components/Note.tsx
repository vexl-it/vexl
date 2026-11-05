import React from 'react'
import {styled, useTheme} from 'tamagui'

import {type IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {CardButton} from './CardButton'
import {TEXT_AREA_MIN_HEIGHT} from './LabeledTextArea'
import {NoteMeta} from './NoteMeta'
import {TwoToneCard} from './TwoToneCard'
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
  /** `preview` shows the full message in a larger font, e.g. above a reply input. */
  readonly variant?: 'card' | 'preview'
  readonly avatar: React.ReactNode
  readonly name?: string
  readonly commonFriends?: string
  readonly trustedFriends?: string
  readonly expiration: string
  readonly message: string
  readonly messageNumberOfLines?: number
  readonly tag?: NoteTag
  readonly onPress?: () => void
  readonly actionButton?: NoteActionButton
}

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

export function Note({
  variant = 'card',
  avatar,
  name,
  commonFriends,
  trustedFriends,
  expiration,
  message,
  messageNumberOfLines,
  tag,
  onPress,
  actionButton,
}: NoteProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = theme.foregroundSecondary.get()
  const TagIcon = tag?.icon
  const isPreview = variant === 'preview'

  return (
    <TwoToneCard onPress={onPress}>
      <TwoToneCard.Header gap="$4">
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
            <NoteMeta
              commonFriends={commonFriends}
              trustedFriends={trustedFriends}
              expiration={expiration}
            />
          </YStack>
        </HeaderFrame>
      </TwoToneCard.Header>
      <TwoToneCard.Content
        gap="$3"
        minHeight={isPreview ? TEXT_AREA_MIN_HEIGHT : undefined}
      >
        <Typography
          variant={isPreview ? 'paragraph' : 'description'}
          color={isPreview ? '$foregroundPrimary' : '$foregroundSecondary'}
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
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}

import React from 'react'
import {styled} from 'tamagui'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const PersonRowFrame = styled(XStack, {
  name: 'PersonRow',
  alignItems: 'center',
  gap: '$3',

  variants: {
    surface: {
      none: {paddingVertical: '$4'},
      primary: {
        backgroundColor: '$backgroundPrimary',
        borderRadius: '$5',
        padding: '$3',
      },
      secondary: {
        backgroundColor: '$backgroundSecondary',
        borderRadius: '$5',
        padding: '$3',
      },
    },
  } as const,
})

export interface PersonRowProps {
  readonly avatar: React.ReactNode
  readonly title: string
  readonly subtitle?: string
  readonly trailing?: React.ReactNode
  readonly dimmed?: boolean
  readonly size?: 'medium' | 'large'
  readonly background?: 'none' | 'primary' | 'secondary'
  readonly testID?: string
  readonly subtitleTestID?: string
}

export function PersonRow({
  avatar,
  title,
  subtitle,
  trailing,
  dimmed = false,
  size = 'medium',
  background = 'none',
  testID,
  subtitleTestID,
}: PersonRowProps): React.JSX.Element {
  return (
    <PersonRowFrame testID={testID} surface={background}>
      {avatar}
      <YStack flex={1} minWidth={0} gap={size === 'large' ? '$2' : '$1'}>
        <Typography
          variant={size === 'large' ? 'paragraphSmallBold' : 'descriptionBold'}
          color={dimmed ? '$foregroundTertiary' : '$foregroundPrimary'}
          numberOfLines={1}
        >
          {title}
        </Typography>
        {subtitle != null ? (
          <Typography
            testID={subtitleTestID}
            variant="micro"
            color={dimmed ? '$foregroundTertiary' : '$foregroundSecondary'}
            numberOfLines={1}
          >
            {subtitle}
          </Typography>
        ) : null}
      </YStack>
      {trailing != null ? <Stack flexShrink={0}>{trailing}</Stack> : null}
    </PersonRowFrame>
  )
}

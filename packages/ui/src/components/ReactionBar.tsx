import {Array, pipe} from 'effect'
import React from 'react'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'

import {surfaceShadow} from '../config/shadows'
import {tokens} from '../config/tokens'
import {Stack, XStack} from '../primitives'
import {Typography} from './Typography'

const REACTION_SIZE = tokens.size[9].val
const BAR_PADDING = tokens.space[2].val
const STAGGER_STEP = 0.06

export const REACTION_BAR_HEIGHT = REACTION_SIZE + BAR_PADDING * 2

export function reactionBarWidth(emojisCount: number): number {
  return REACTION_SIZE * emojisCount + BAR_PADDING * 2
}

export interface ReactionBarProps<Emoji extends string> {
  readonly emojis: readonly Emoji[]
  readonly selected?: Emoji
  readonly onSelect: (emoji: Emoji) => void
  /** 0 → 1 open progress; emojis pop in one after another while it runs. */
  readonly progress?: SharedValue<number>
}

function Reaction<Emoji extends string>({
  emoji,
  index,
  selected,
  progress,
  onSelect,
}: {
  readonly emoji: Emoji
  readonly index: number
  readonly selected: boolean
  readonly progress: SharedValue<number> | undefined
  readonly onSelect: (emoji: Emoji) => void
}): React.JSX.Element {
  const staggeredStyle = useAnimatedStyle(() => {
    if (!progress) return {}
    const start = index * STAGGER_STEP
    return {
      transform: [
        {
          scale: interpolate(
            progress.value,
            [start, start + 0.5],
            [0.4, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    }
  })

  return (
    <Animated.View style={staggeredStyle}>
      <Stack
        role="button"
        width={REACTION_SIZE}
        height={REACTION_SIZE}
        borderRadius={REACTION_SIZE}
        alignItems="center"
        justifyContent="center"
        backgroundColor={selected ? '$backgroundHighlight' : undefined}
        pressStyle={{scale: 1.2}}
        onPress={() => {
          onSelect(emoji)
        }}
      >
        <Typography variant="heading3" color="$foregroundPrimary">
          {emoji}
        </Typography>
      </Stack>
    </Animated.View>
  )
}

export function ReactionBar<Emoji extends string>({
  emojis,
  selected,
  onSelect,
  progress,
}: ReactionBarProps<Emoji>): React.JSX.Element {
  return (
    <XStack
      padding={BAR_PADDING}
      borderRadius={REACTION_BAR_HEIGHT}
      backgroundColor="$backgroundOnBar"
      boxShadow={surfaceShadow}
    >
      {pipe(
        emojis,
        Array.map((emoji, index) => (
          <Reaction
            key={emoji}
            emoji={emoji}
            index={index}
            selected={emoji === selected}
            progress={progress}
            onSelect={onSelect}
          />
        ))
      )}
    </XStack>
  )
}

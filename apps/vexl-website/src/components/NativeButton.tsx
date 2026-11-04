'use client'

import {YStack} from '@vexl-next/ui'
import React from 'react'

/** A real <button>, so keyboard and screen readers work, around any visual. */
export function NativeButton({
  onPress,
  label,
  current,
  children,
  ...rest
}: Omit<React.ComponentProps<typeof YStack>, 'tag'> & {
  readonly onPress: () => void
  readonly label?: string
  readonly current?: 'step'
}): React.JSX.Element {
  return (
    <YStack
      tag="button"
      aria-label={label}
      aria-current={current}
      onPress={onPress}
      cursor="pointer"
      borderWidth={0}
      padding={0}
      backgroundColor="$transparent"
      // Buttons center their text by default; the visuals inside set their own
      style={{textAlign: 'left'}}
      focusVisibleStyle={{
        outlineWidth: 2,
        outlineStyle: 'solid',
        outlineColor: '$accentYellowPrimary',
        outlineOffset: 2,
      }}
      {...rest}
    >
      {children}
    </YStack>
  )
}

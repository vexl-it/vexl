import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack, XStack} from '../primitives'

const SegmentedPickerFrame = styled(XStack, {
  name: 'SegmentedPickerFrame',
  height: '$11',
  borderRadius: '$5',
  overflow: 'hidden',
  alignSelf: 'stretch',
  columnGap: '$0.5',
})

const SegmentFrame = styled(Stack, {
  name: 'SegmentFrame',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$5',
  backgroundColor: '$backgroundSecondary',

  variants: {
    selected: {
      true: {
        backgroundColor: '$accentYellowSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const SegmentLabel = styled(SizableText, {
  name: 'SegmentLabel',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '500',
  color: '$foregroundPrimary',
  textAlign: 'center',
  numberOfLines: 1,

  variants: {
    selected: {
      true: {
        fontWeight: '600',
        color: '$accentHighlightPrimary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

export interface SegmentedPickerTab<T> {
  readonly label: string
  readonly value: T
}

export interface SegmentedPickerProps<T> {
  readonly tabs: ReadonlyArray<SegmentedPickerTab<T>>
  readonly activeTab: T
  readonly onTabPress: (value: T) => void
}

export function SegmentedPicker<T>({
  tabs,
  activeTab,
  onTabPress,
}: SegmentedPickerProps<T>): React.JSX.Element {
  return (
    <SegmentedPickerFrame>
      {tabs.map((tab) => {
        const isSelected = tab.value === activeTab
        return (
          <SegmentFrame
            key={tab.label}
            selected={isSelected}
            onPress={() => {
              onTabPress(tab.value)
            }}
          >
            <SegmentLabel selected={isSelected}>{tab.label}</SegmentLabel>
          </SegmentFrame>
        )
      })}
    </SegmentedPickerFrame>
  )
}

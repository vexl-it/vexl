import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import {styled, useTheme} from 'tamagui'

import {SearchMagnifyGlass} from '../icons/SearchMagnifyGlass'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {Input, Stack, XStack} from '../primitives'

const SearchBarFrame = styled(XStack, {
  name: 'SearchBar',
  alignItems: 'center',
  alignSelf: 'stretch',
  gap: '$3',
  height: '$10',
  paddingHorizontal: '$4',
  borderRadius: '$11',
  backgroundColor: '$backgroundSecondary',
})

const SearchBarInput = styled(Input, {
  name: 'SearchBarInput',
  unstyled: true,
  flex: 1,
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$foregroundPrimary',
  padding: 0,
})

type SearchBarFrameProps = React.ComponentProps<typeof SearchBarFrame>

export interface SearchBarProps extends Omit<SearchBarFrameProps, 'children'> {
  readonly valueAtom: WritableAtom<string, [SetStateAction<string>], void>
  readonly placeholder?: string
  readonly autoFocus?: boolean
}

export function SearchBar({
  valueAtom,
  placeholder = 'Search',
  autoFocus,
  ...rest
}: SearchBarProps): React.JSX.Element {
  const [text, setText] = useAtom(valueAtom)
  const theme = useTheme()
  const iconColor = theme.foregroundPrimary.val
  const hasText = text.length > 0

  return (
    <SearchBarFrame {...rest}>
      <SearchMagnifyGlass size={24} color={iconColor} />
      <SearchBarInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={theme.foregroundPrimary.val}
        selectionColor={theme.accentYellowPrimary.val}
        autoFocus={autoFocus}
      />
      {hasText ? (
        <Stack
          role="button"
          onPress={() => {
            setText('')
          }}
          pressStyle={{opacity: 0.7}}
        >
          <XmarkCancelClose size={24} color={iconColor} />
        </Stack>
      ) : null}
    </SearchBarFrame>
  )
}

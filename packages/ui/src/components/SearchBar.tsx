import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {SearchMagnifyGlass} from '../icons/SearchMagnifyGlass'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {Stack, XStack} from '../primitives'
import {FieldInput} from './Field'

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

type SearchBarFrameProps = React.ComponentProps<typeof SearchBarFrame>

interface SharedSearchBarProps extends Omit<SearchBarFrameProps, 'children'> {
  readonly placeholder?: string
}

interface DummySearchBarProps extends SharedSearchBarProps {
  readonly variant: 'dummy'
  readonly onPress: () => void
}

interface NormalSearchBarProps extends SharedSearchBarProps {
  readonly variant?: 'normal'
  readonly valueAtom: WritableAtom<string, [SetStateAction<string>], void>
  readonly autoFocus?: boolean
}

export type SearchBarProps = DummySearchBarProps | NormalSearchBarProps

export function SearchBar(props: SearchBarProps): React.JSX.Element {
  if (props.variant === 'dummy') {
    const {variant: _variant, placeholder, onPress, ...rest} = props
    return (
      <SearchBarFrame
        {...rest}
        role="button"
        onPress={onPress}
        pressStyle={{opacity: 0.7}}
        cursor="pointer"
      >
        <SearchBarContent value="" placeholder={placeholder} editable={false} />
      </SearchBarFrame>
    )
  }

  const {variant: _variant, ...rest} = props
  return <AtomSearchBar {...rest} />
}

function AtomSearchBar({
  valueAtom,
  placeholder,
  autoFocus,
  ...rest
}: Omit<NormalSearchBarProps, 'variant'>): React.JSX.Element {
  const [text, setText] = useAtom(valueAtom)

  return (
    <SearchBarFrame {...rest}>
      <SearchBarContent
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        autoFocus={autoFocus}
        editable
      />
    </SearchBarFrame>
  )
}

function SearchBarContent({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  editable,
}: {
  readonly value: string
  readonly onChangeText?: (text: string) => void
  readonly placeholder?: string
  readonly autoFocus?: boolean
  readonly editable: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const iconColor = theme.foregroundPrimary.get()
  const iconSize = getTokens().size.$7.val

  return (
    <>
      <SearchMagnifyGlass size={iconSize} color={iconColor} />
      <FieldInput
        value={value}
        onChangeText={onChangeText}
        focusable={editable}
        editable={editable}
        pointerEvents={editable ? undefined : 'none'}
        placeholder={placeholder}
        placeholderTextColor={iconColor}
        selectionColor={theme.accentYellowPrimary.get()}
        autoFocus={autoFocus}
      />
      {onChangeText !== undefined && value.length > 0 ? (
        <Stack
          role="button"
          onPress={() => {
            onChangeText('')
          }}
          pressStyle={{opacity: 0.7}}
        >
          <XmarkCancelClose size={iconSize} color={iconColor} />
        </Stack>
      ) : null}
    </>
  )
}

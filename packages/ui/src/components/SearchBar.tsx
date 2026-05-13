import type {SetStateAction, WritableAtom} from 'jotai'
import {atom, useAtom} from 'jotai'
import React, {useMemo} from 'react'
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

interface SharedSearchBarProps extends Omit<SearchBarFrameProps, 'children'> {
  readonly placeholder?: string
  variant?: 'dummy' | 'normal'
}
interface DummySearchBarProps {
  variant: 'dummy'
  onPress: () => void
}

interface NormalSearchBarProps {
  readonly valueAtom: WritableAtom<string, [SetStateAction<string>], void>
  readonly autoFocus?: boolean
}

export type SearchBarProps = SharedSearchBarProps &
  (DummySearchBarProps | NormalSearchBarProps)

export function SearchBar(props: SearchBarProps): React.JSX.Element {
  const {variant, placeholder, autoFocus, onPress, valueAtom, ...rest} =
    useMemo(() => {
      if (props.variant === 'dummy') {
        return {
          ...props,
          variant: 'dummy',
          onPress: props.onPress,
          placeholder: props.placeholder,
          valueAtom: atom(
            () => '',
            () => {}
          ),
          autoFocus: false,
        }
      }

      return {
        ...props,
        variant: 'normal',
        onPress: undefined,
        placeholder: props.placeholder,
        valueAtom: props.valueAtom,
        autoFocus: props.autoFocus,
      }
    }, [props])

  const [text, setText] = useAtom(valueAtom)
  const theme = useTheme()
  const isDummy = variant === 'dummy'
  const iconColor = theme.foregroundPrimary.get()
  const hasText = !isDummy && text.length > 0

  return (
    <SearchBarFrame
      {...rest}
      role={isDummy ? 'button' : undefined}
      onPress={isDummy ? onPress : undefined}
      pressStyle={isDummy ? {opacity: 0.7} : undefined}
      cursor={isDummy ? 'pointer' : undefined}
    >
      <SearchMagnifyGlass size={24} color={iconColor} />
      <SearchBarInput
        value={isDummy ? '' : text}
        onChangeText={isDummy ? undefined : setText}
        focusable={!isDummy}
        editable={!isDummy}
        pointerEvents={isDummy ? 'none' : undefined}
        placeholder={placeholder}
        placeholderTextColor={theme.foregroundPrimary.get()}
        selectionColor={theme.accentYellowPrimary.get()}
        autoFocus={isDummy ? false : autoFocus}
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

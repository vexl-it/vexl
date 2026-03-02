import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import {styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack} from '../primitives'
import {Switch} from './Switch'

const SelectorActionFrame = styled(XStack, {
  name: 'SelectorAction',
  role: 'button',
  alignItems: 'center',
  gap: '$3',
  height: '$11',
  paddingHorizontal: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.7,
  },
})

const SelectorSwitchFrame = styled(XStack, {
  name: 'SelectorSwitch',
  role: 'button',
  alignItems: 'center',
  gap: '$3',
  height: '$11',
  paddingHorizontal: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',
})

const SelectorLabel = styled(SizableText, {
  name: 'SelectorLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  color: '$foregroundPrimary',
  flex: 1,
})

interface SelectorBaseProps {
  readonly label: string
  readonly icon?: React.ComponentType<IconProps>
}

export interface SelectorActionProps extends SelectorBaseProps {
  readonly variant?: 'action'
  readonly onPress: () => void
  readonly valueAtom?: never
}

export interface SelectorSwitchProps extends SelectorBaseProps {
  readonly variant: 'switch'
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
  readonly onPress?: never
}

export type SelectorProps = SelectorActionProps | SelectorSwitchProps

export function Selector(props: SelectorProps): React.JSX.Element {
  if (props.variant === 'switch') {
    return (
      <SelectorSwitch
        label={props.label}
        icon={props.icon}
        valueAtom={props.valueAtom}
      />
    )
  }

  return (
    <SelectorAction
      label={props.label}
      icon={props.icon}
      onPress={props.onPress}
    />
  )
}

function SelectorAction({
  label,
  icon: Icon,
  onPress,
}: {
  readonly label: string
  readonly icon?: React.ComponentType<IconProps>
  readonly onPress: () => void
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <SelectorActionFrame onPress={onPress}>
      {Icon ? <Icon color={theme.foregroundPrimary.val} size={24} /> : null}
      <SelectorLabel>{label}</SelectorLabel>
      <ChevronRight color={theme.foregroundSecondary.val} size={24} />
    </SelectorActionFrame>
  )
}

function SelectorSwitch({
  label,
  icon: Icon,
  valueAtom,
}: {
  readonly label: string
  readonly icon?: React.ComponentType<IconProps>
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}): React.JSX.Element {
  const theme = useTheme()
  const [, setIsOn] = useAtom(valueAtom)

  return (
    <SelectorSwitchFrame
      onPress={() => {
        setIsOn((prev) => !prev)
      }}
    >
      {Icon ? <Icon color={theme.foregroundPrimary.val} size={24} /> : null}
      <SelectorLabel>{label}</SelectorLabel>
      <Stack alignSelf="center" justifyContent="center">
        <Switch valueAtom={valueAtom} />
      </Stack>
    </SelectorSwitchFrame>
  )
}

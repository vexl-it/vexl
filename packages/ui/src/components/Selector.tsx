import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import type {IconProps} from '../icons/types'
import {Stack} from '../primitives'
import {FieldFrame} from './Field'
import {Switch} from './Switch'
import {Typography} from './Typography'

type FieldFrameProps = React.ComponentProps<typeof FieldFrame>

interface SelectorBaseProps {
  readonly label: string
  readonly icon?: React.ComponentType<IconProps>
  readonly backgroundColor?: FieldFrameProps['backgroundColor']
}

export interface SelectorActionProps extends SelectorBaseProps {
  readonly variant?: 'action'
  readonly onPress: () => void
  /** Accent-coloured label and chevron, for a row that shows a chosen value. */
  readonly accent?: boolean
  readonly valueAtom?: never
}

export interface SelectorSwitchProps extends SelectorBaseProps {
  readonly variant: 'switch'
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
  readonly onPress?: never
  readonly accent?: never
}

export type SelectorProps = SelectorActionProps | SelectorSwitchProps

export function Selector(props: SelectorProps): React.JSX.Element {
  if (props.variant === 'switch') {
    return (
      <SelectorSwitch
        label={props.label}
        icon={props.icon}
        backgroundColor={props.backgroundColor}
        valueAtom={props.valueAtom}
      />
    )
  }

  return (
    <SelectorAction
      label={props.label}
      icon={props.icon}
      backgroundColor={props.backgroundColor}
      onPress={props.onPress}
      accent={props.accent}
    />
  )
}

function SelectorLabel({
  label,
  accent = false,
}: {
  readonly label: string
  readonly accent?: boolean
}): React.JSX.Element {
  return (
    <Typography
      variant="paragraph"
      color={accent ? '$accentHighlightPrimary' : '$foregroundPrimary'}
      flex={1}
    >
      {label}
    </Typography>
  )
}

function SelectorAction({
  label,
  icon: Icon,
  backgroundColor = '$backgroundSecondary',
  onPress,
  accent = false,
}: {
  readonly label: string
  readonly icon?: React.ComponentType<IconProps>
  readonly backgroundColor?: FieldFrameProps['backgroundColor']
  readonly onPress: () => void
  readonly accent?: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const iconSize = getTokens().size.$7.val

  return (
    <FieldFrame
      pressable
      role="button"
      backgroundColor={backgroundColor}
      onPress={onPress}
    >
      {Icon ? (
        <Icon color={theme.foregroundPrimary.get()} size={iconSize} />
      ) : null}
      <SelectorLabel label={label} accent={accent} />
      <ChevronRight
        color={
          accent
            ? theme.accentHighlightPrimary.get()
            : theme.foregroundSecondary.get()
        }
        size={iconSize}
      />
    </FieldFrame>
  )
}

function SelectorSwitch({
  label,
  icon: Icon,
  backgroundColor = '$backgroundSecondary',
  valueAtom,
}: {
  readonly label: string
  readonly icon?: React.ComponentType<IconProps>
  readonly backgroundColor?: FieldFrameProps['backgroundColor']
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}): React.JSX.Element {
  const theme = useTheme()
  const iconSize = getTokens().size.$7.val
  const [, setIsOn] = useAtom(valueAtom)

  return (
    <FieldFrame
      role="button"
      backgroundColor={backgroundColor}
      onPress={() => {
        setIsOn((prev) => !prev)
      }}
    >
      {Icon ? (
        <Icon color={theme.foregroundPrimary.get()} size={iconSize} />
      ) : null}
      <SelectorLabel label={label} />
      <Stack alignSelf="center" justifyContent="center">
        <Switch valueAtom={valueAtom} />
      </Stack>
    </FieldFrame>
  )
}

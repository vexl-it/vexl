import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  YStack,
  type NavigationBarAction,
} from '@vexl-next/ui'
import type {ReactNode} from 'react'
import {noop} from '../../shared/noop'
import {Tap} from '../../shared/Tap'

/** A trade checklist screen: title bar, padded content and one bottom button. */
export function ChecklistPage({
  title,
  hideBack,
  rightActions,
  button,
  children,
}: {
  title: string
  hideBack?: boolean
  rightActions?: NavigationBarAction[]
  button?: {
    text: string
    variant?: 'primary' | 'secondary'
    disabled?: boolean
    tap: boolean
  }
  children: ReactNode
}): React.JSX.Element {
  return (
    <Screen
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={title}
          leftAction={hideBack ? undefined : {icon: ChevronLeft, onPress: noop}}
          rightActions={rightActions}
        />
      }
      footer={
        button ? (
          <Tap on={button.tap}>
            <Button
              variant={button.variant ?? 'primary'}
              disabled={button.disabled}
              onPress={noop}
            >
              {button.text}
            </Button>
          </Tap>
        ) : undefined
      }
    >
      <YStack flex={1} p="$5" overflow="hidden">
        {children}
      </YStack>
    </Screen>
  )
}

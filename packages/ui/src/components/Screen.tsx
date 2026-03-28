import React from 'react'
import {ScrollView} from 'react-native'
import {styled} from 'tamagui'

import {Stack, YStack} from '../primitives'

const ScreenFrame = styled(YStack, {
  name: 'Screen',
  flex: 1,
  backgroundColor: '$backgroundPrimary',
})

const ScreenContentPadding = styled(YStack, {
  name: 'ScreenContentPadding',
  paddingHorizontal: '$5',
  flexGrow: 1,
})

const ScreenFooterFrame = styled(Stack, {
  name: 'ScreenFooter',
  paddingHorizontal: '$5',
  paddingTop: '$5',
  paddingBottom: '$8',
})

export interface ScreenProps {
  readonly navigationBar?: React.ReactNode
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
  readonly topInset?: number
  readonly bottomInset?: number
}

export function Screen({
  navigationBar,
  children,
  footer,
  topInset,
  bottomInset,
}: ScreenProps): React.JSX.Element {
  return (
    <ScreenFrame paddingTop={topInset}>
      {navigationBar}
      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}
      >
        <ScreenContentPadding paddingBottom={bottomInset}>
          {children}
        </ScreenContentPadding>
      </ScrollView>
      {footer ? (
        <ScreenFooterFrame paddingBottom={bottomInset}>
          {footer}
        </ScreenFooterFrame>
      ) : null}
    </ScreenFrame>
  )
}

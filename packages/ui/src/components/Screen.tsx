import {atom, useSetAtom} from 'jotai'
import React, {useContext} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {styled} from 'tamagui'

import {ScrollView, Stack, YStack} from '../primitives'

const defaultFooterHeightAtom = atom(0)

const FooterHeightAtomContext = React.createContext({
  footerHeightAtom: defaultFooterHeightAtom,
})

export function useScreenFooterHeight(): {
  footerHeightAtom: typeof defaultFooterHeightAtom
} {
  return useContext(FooterHeightAtomContext)
}

const ScreenFrame = styled(YStack, {
  name: 'Screen',
  flex: 1,
  backgroundColor: '$backgroundPrimary',
})

const ScreenFooterFrame = styled(Stack, {
  name: 'ScreenFooter',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: '$5',
  paddingTop: '$5',
})

const OverlayNavigationBarFrame = styled(Stack, {
  name: 'ScreenOverlayNavigationBar',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
})

export interface ScreenProps {
  readonly navigationBar: React.ReactNode
  readonly overlayNavigationBar?: boolean
  readonly scrollable?: boolean
  noHorizontalPadding?: boolean
  readonly footer?: React.ReactNode
  readonly children: React.ReactNode
}

export function Screen({
  navigationBar,
  overlayNavigationBar,
  scrollable,
  noHorizontalPadding,
  children,
  footer,
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const {footerHeightAtom} = useScreenFooterHeight()
  const setFooterHeight = useSetAtom(footerHeightAtom)
  const [footerHeight, setLocalFooterHeight] = React.useState(0)
  const bottomInsetOutsideContent = scrollable && !footer ? 0 : insets.bottom
  const scrollViewBottomPadding = footer ? footerHeight : insets.bottom

  const content = overlayNavigationBar ? (
    <YStack flex={1}>{children}</YStack>
  ) : (
    <YStack
      flex={1}
      paddingTop="$3"
      paddingHorizontal={noHorizontalPadding ? undefined : '$5'}
    >
      {children}
    </YStack>
  )

  return (
    <FooterHeightAtomContext.Provider value={{footerHeightAtom}}>
      <ScreenFrame
        paddingTop={overlayNavigationBar ? 0 : insets.top}
        marginBottom={bottomInsetOutsideContent}
      >
        {overlayNavigationBar ? (
          <OverlayNavigationBarFrame paddingTop={insets.top}>
            {navigationBar}
          </OverlayNavigationBarFrame>
        ) : (
          navigationBar
        )}
        {scrollable ? (
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: scrollViewBottomPadding,
            }}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
        {footer ? (
          <ScreenFooterFrame
            onLayout={(e) => {
              const measuredFooterHeight = e.nativeEvent.layout.height
              setLocalFooterHeight(measuredFooterHeight)
              setFooterHeight(measuredFooterHeight)
            }}
          >
            {footer}
          </ScreenFooterFrame>
        ) : null}
      </ScreenFrame>
    </FooterHeightAtomContext.Provider>
  )
}

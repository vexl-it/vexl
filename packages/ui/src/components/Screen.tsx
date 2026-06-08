import {atom, useSetAtom} from 'jotai'
import React, {useContext} from 'react'
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {styled, type StackProps, type YStackProps} from 'tamagui'

import {Stack, YStack} from '../primitives'

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
  readonly safeAreasBackgroundColor?: YStackProps['backgroundColor']
  readonly noHorizontalPadding?: boolean
  readonly footer?: React.ReactNode
  readonly footerAvoidsKeyboard?: boolean
  readonly footerFrameProps?: StackProps
  readonly children: React.ReactNode
}

export function Screen({
  navigationBar,
  overlayNavigationBar,
  scrollable,
  safeAreasBackgroundColor,
  noHorizontalPadding,
  children,
  footer,
  footerAvoidsKeyboard = true,
  footerFrameProps,
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const {footerHeightAtom} = useScreenFooterHeight()
  const setFooterHeight = useSetAtom(footerHeightAtom)
  const [footerHeight, setLocalFooterHeight] = React.useState(0)
  const footerHeightRef = React.useRef(0)
  const footerOwnsBottomInset = !!footer
  const bottomInsetOutsideContent =
    scrollable || footerOwnsBottomInset ? 0 : insets.bottom
  const scrollViewBottomPadding = footer ? footerHeight : insets.bottom

  const content = overlayNavigationBar ? (
    <YStack flex={1}>{children}</YStack>
  ) : (
    <YStack flex={1} paddingHorizontal={noHorizontalPadding ? undefined : '$5'}>
      <Stack
        width="100%"
        paddingTop="$3"
        backgroundColor={safeAreasBackgroundColor}
      />
      {children}
    </YStack>
  )

  const handleFooterLayout = React.useCallback(
    (e: {nativeEvent: {layout: {height: number}}}) => {
      const measuredFooterHeight = e.nativeEvent.layout.height
      if (footerHeightRef.current === measuredFooterHeight) return

      footerHeightRef.current = measuredFooterHeight
      setLocalFooterHeight(measuredFooterHeight)
      setFooterHeight(measuredFooterHeight)
    },
    [setFooterHeight]
  )

  const footerContent = footer ? (
    <ScreenFooterFrame
      paddingBottom={insets.bottom}
      {...footerFrameProps}
      onLayout={handleFooterLayout}
    >
      {footer}
    </ScreenFooterFrame>
  ) : null

  return (
    <FooterHeightAtomContext.Provider value={{footerHeightAtom}}>
      <Stack
        backgroundColor={safeAreasBackgroundColor}
        width="100%"
        height={overlayNavigationBar ? 0 : insets.top}
      />
      <ScreenFrame>
        {overlayNavigationBar ? (
          <OverlayNavigationBarFrame paddingTop={insets.top}>
            {navigationBar}
          </OverlayNavigationBarFrame>
        ) : (
          navigationBar
        )}
        {scrollable ? (
          <KeyboardAwareScrollView
            style={{flex: 1}}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: scrollViewBottomPadding,
            }}
            bottomOffset={footer ? footerHeight : 0}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </KeyboardAwareScrollView>
        ) : (
          content
        )}
        {footerContent && footerAvoidsKeyboard ? (
          <KeyboardStickyView
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }}
          >
            {footerContent}
          </KeyboardStickyView>
        ) : footerContent ? (
          <Stack position="absolute" bottom={0} left={0} right={0}>
            {footerContent}
          </Stack>
        ) : null}
      </ScreenFrame>
      <Stack
        height={bottomInsetOutsideContent}
        backgroundColor={safeAreasBackgroundColor}
        width="100%"
      />
    </FooterHeightAtomContext.Provider>
  )
}

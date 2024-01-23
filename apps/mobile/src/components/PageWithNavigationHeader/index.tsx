import {useNavigation} from '@react-navigation/native'
import React, {type ReactNode} from 'react'
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'
import {runOnJS} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import useSafeGoBack from '../../utils/useSafeGoBack'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import FooterButtons from './components/FooterButtons'
import Header from './components/Header'
import {
  useSetPrimaryFooterButtonState,
  useSetSecondaryFooterButtonState,
  type FooterButtonState,
} from './state/footerButtonStateAtom'
import {useSetHeaderState, type HeaderState} from './state/headerStateAtom'

interface Props {
  children: ReactNode
  fullScreen?: boolean
}

function PageWithNavigationHeader({children, fullScreen}: Props): JSX.Element {
  const goBack = useSafeGoBack()
  const {bottom} = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView>
      <GestureDetector
        gesture={Gesture.Fling()
          .direction(Directions.DOWN)
          .onEnd(() => {
            runOnJS(goBack)()
          })}
      >
        <Stack
          f={1}
          bc="$black"
          pt={fullScreen ? 0 : '$2'}
          px={fullScreen ? 0 : '$2'}
          btlr={fullScreen ? 0 : '$7'}
          btrr={fullScreen ? 0 : '$7'}
          mb={fullScreen ? 0 : bottom + 20}
        >
          <Header />
          {children}
          <FooterButtons />
        </Stack>
      </GestureDetector>
    </KeyboardAvoidingView>
  )
}

export default PageWithNavigationHeader

export function HeaderProxy(props: Omit<HeaderState, 'goBack'>): null {
  const {goBack} = useNavigation()

  useSetHeaderState({
    ...props,
    goBack,
  })
  return null
}

export function PrimaryFooterButtonProxy(props: FooterButtonState): null {
  useSetPrimaryFooterButtonState(props)
  return null
}

export function SecondaryFooterButtonProxy(props: FooterButtonState): null {
  useSetSecondaryFooterButtonState(props)
  return null
}

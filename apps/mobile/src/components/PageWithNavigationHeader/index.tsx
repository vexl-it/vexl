import {useNavigation} from '@react-navigation/native'
import React, {type ReactNode} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
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
  const {bottom} = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView>
      <Stack
        f={1}
        bc="$black"
        pt={fullScreen ? 0 : '$2'}
        px={fullScreen ? 0 : '$2'}
        btlr={fullScreen ? 0 : '$7'}
        btrr={fullScreen ? 0 : '$7'}
        pb={fullScreen ? 0 : bottom}
      >
        <Header />
        {children}
        <FooterButtons />
      </Stack>
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

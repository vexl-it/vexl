import React, {type ReactNode} from 'react'
import {Stack} from 'tamagui'
import {type HeaderState, useSetHeaderState} from './state/headerStateAtom'
import {useNavigation} from '@react-navigation/native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Header from './components/Header'
import FooterButton from './components/FooterButton'
import {
  type FooterButtonState,
  useSetFooterButtonState,
} from './state/footerButtonStateAtom'
import KeyboardAvoidingView from '../KeyboardAvoidingView'

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
        mb={fullScreen ? 0 : bottom + 20}
      >
        <Header />
        {children}
        <FooterButton />
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

export function FooterButtonProxy(props: FooterButtonState): null {
  useSetFooterButtonState(props)
  return null
}

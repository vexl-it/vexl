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
}

function PageWithNavigationHeader({children}: Props): JSX.Element {
  const {bottom} = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView>
      <Stack
        f={1}
        bc={'$black'}
        pt={'$2'}
        px={'$2'}
        btlr={'$7'}
        btrr={'$7'}
        mb={bottom + 20}
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

import {KeyboardAvoidingView} from '@vexl-next/ui'
import React, {type ReactNode} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import useSafeGoBack from '../../utils/useSafeGoBack'
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
}

function PageWithNavigationHeader({children}: Props): React.ReactElement {
  const {bottom, top} = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView>
      <Stack
        backgroundColor="$backgroundPrimary"
        f={1}
        pt={top}
        pb={bottom}
        px="$5"
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
  const goBack = useSafeGoBack()

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

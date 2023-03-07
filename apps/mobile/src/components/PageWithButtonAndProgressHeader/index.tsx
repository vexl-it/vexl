import {type ReactNode, useCallback} from 'react'
import styled from '@emotion/native'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import {StatusBar as RNStatusBar, View} from 'react-native'
import Header from './components/Header'
import NextButton from './components/NextButton'
import {
  type NextButtonState,
  useSetNextButtonState,
} from './state/nextButtonStateAtom'
import {type HeaderState, useSetHeaderState} from './state/headerStateAtom'
import {useNavigation} from '@react-navigation/native'

const RootContainer = styled.SafeAreaView`
  background-color: ${(p) => p.theme.colors.backgroundBlack};
  flex: 1;
`

const InnerContainer = styled.View`
  flex: 1;
  padding: 0 8px 8px;
`

function PageWithButtonAndProgressHeader({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return (
    <KeyboardAvoidingView>
      <RootContainer>
        <View style={{height: RNStatusBar.currentHeight ?? 0}} />
        <InnerContainer>
          <Header />
          {children}
          <NextButton />
        </InnerContainer>
      </RootContainer>
    </KeyboardAvoidingView>
  )
}

export default PageWithButtonAndProgressHeader

export function NextButtonProxy(props: NextButtonState): null {
  useSetNextButtonState(useCallback(() => props, [props]))
  return null
}

export function HeaderProxy(props: Omit<HeaderState, 'goBack'>): null {
  const {canGoBack, goBack} = useNavigation()

  useSetHeaderState(
    useCallback(
      () => ({
        ...props,
        goBack,
        showBackButton: canGoBack() && props.showBackButton,
      }),
      [props, canGoBack, goBack]
    )
  )
  return null
}

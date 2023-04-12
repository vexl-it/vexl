import {type ReactNode, useCallback} from 'react'
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
import {Stack} from 'tamagui'
import Screen from '../Screen'

function PageWithButtonAndProgressHeader({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return (
    <KeyboardAvoidingView>
      <Screen>
        <View style={{height: RNStatusBar.currentHeight ?? 0}} />
        <Stack f={1} px="$2" pb="$2">
          <Header />
          {children}
          <NextButton />
        </Stack>
      </Screen>
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

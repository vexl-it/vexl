import {useNavigation} from '@react-navigation/native'
import {useCallback, type ReactNode} from 'react'
import {StatusBar as RNStatusBar, View} from 'react-native'
import {Stack} from 'tamagui'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import Screen from '../Screen'
import Header from './components/Header'
import NextButton from './components/NextButton'
import {useSetHeaderState, type HeaderState} from './state/headerStateAtom'
import {
  useSetNextButtonState,
  type NextButtonState,
} from './state/nextButtonStateAtom'

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

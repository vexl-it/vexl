import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {Keyboard, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import {type JoinClubFlowStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useIsKeyboardShown from '../../../../utils/useIsKeyboardShown'
import Button from '../../../Button'
import KeyboardAvoidingView from '../../../KeyboardAvoidingView'
import Screen from '../../../Screen'
import WhiteContainer from '../../../WhiteContainer'
import {accessCodeMolecule} from '../../atoms'
import Header from '../Header'
import OTPInput from './components/OTPInput'

type Props = JoinClubFlowStackScreenProps<'FillClubAccessCodeScreen'>

function FillClubAccessCodeScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const {isCodeFilledAtom, isCodeInvalidAtom, handleCodeSubmitActionAtom} =
    useMolecule(accessCodeMolecule)
  const isCodeInvalid = useAtomValue(isCodeInvalidAtom)
  const isCodeFilled = useAtomValue(isCodeFilledAtom)
  const handleCodeSubmit = useSetAtom(handleCodeSubmitActionAtom)
  const isKeyboardShown = useIsKeyboardShown()

  return (
    <KeyboardAvoidingView>
      <Screen gap="$4">
        <Header />
        <WhiteContainer>
          <YStack f={1} ai="center" gap="$4">
            <Text col="$black" ff="$heading" fos={24}>
              {t('clubs.fillClubAccessCodeBelow')}
            </Text>
            <TouchableWithoutFeedback>
              <Stack paddingVertical="$4">
                <OTPInput />
              </Stack>
            </TouchableWithoutFeedback>
            {!!isCodeInvalid && (
              <Text fos={14} ff="$body600" col="$red">
                {t('clubs.accessDeniedCodeIsInvalid')}
              </Text>
            )}
          </YStack>
        </WhiteContainer>
        <Button
          disabled={!isCodeFilled}
          variant="secondary"
          text={t('clubs.enterCode')}
          onPress={() => {
            if (isKeyboardShown) Keyboard.dismiss()
            void Effect.runPromise(handleCodeSubmit()).then((success) => {
              if (success)
                navigation.navigate('InsideTabs', {
                  screen: 'Marketplace',
                })
            })
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  )
}

export default FillClubAccessCodeScreen

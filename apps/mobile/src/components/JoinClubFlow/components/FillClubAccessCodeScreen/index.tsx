import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {Keyboard, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useIsKeyboardShown from '../../../../utils/useIsKeyboardShown'
import Button from '../../../Button'
import KeyboardAvoidingView from '../../../KeyboardAvoidingView'
import Screen from '../../../Screen'
import WhiteContainer from '../../../WhiteContainer'
import {
  accessCodeDefaultValue,
  accessCodeMolecule,
  AccessCodeScope,
} from '../../atoms'
import Header from '../Header'
import OTPInput from './components/OTPInput'

function FillClubAccessCodeScreenContent(): JSX.Element {
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
            handleCodeSubmit()
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  )
}

function FillClubAccessCodeScreen(): JSX.Element {
  return (
    <ScopeProvider scope={AccessCodeScope} value={atom(accessCodeDefaultValue)}>
      <FillClubAccessCodeScreenContent />
    </ScopeProvider>
  )
}

export default FillClubAccessCodeScreen

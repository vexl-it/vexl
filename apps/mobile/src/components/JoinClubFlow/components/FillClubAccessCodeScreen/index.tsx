import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {Keyboard, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import {type JoinClubFlowStackScreenProps} from '../../../../navigationTypes'
import {submitCodeToJoinClubActionAtom} from '../../../../state/clubs/atom/submitCodeToJoinClubActionAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useIsKeyboardShown from '../../../../utils/useIsKeyboardShown'
import Button from '../../../Button'
import KeyboardAvoidingView from '../../../KeyboardAvoidingView'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import Screen from '../../../Screen'
import WhiteContainer from '../../../WhiteContainer'
import {accessCodeMolecule} from '../../atoms'
import Header from '../Header'
import OTPInput from './components/OTPInput'

type Props = JoinClubFlowStackScreenProps<'FillClubAccessCodeScreen'>

function FillClubAccessCodeScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const {isCodeFilledAtom, isCodeInvalidAtom, accessCodeAtom} =
    useMolecule(accessCodeMolecule)
  const isCodeInvalid = useAtomValue(isCodeInvalidAtom)
  const isCodeFilled = useAtomValue(isCodeFilledAtom)
  const handleCodeSubmit = useSetAtom(submitCodeToJoinClubActionAtom)
  const isKeyboardShown = useIsKeyboardShown()
  const store = useStore()
  const loadingOverlay = useShowLoadingOverlay()

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
            loadingOverlay.show()

            void Effect.runPromise(
              pipe(
                Schema.decode(ClubCode)(store.get(accessCodeAtom).join('')),
                Effect.flatMap(handleCodeSubmit),
                Effect.andThen(() => {
                  navigation.navigate('InsideTabs', {
                    screen: 'Marketplace',
                  })
                  loadingOverlay.hide()
                })
              )
            )
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  )
}

export default FillClubAccessCodeScreen

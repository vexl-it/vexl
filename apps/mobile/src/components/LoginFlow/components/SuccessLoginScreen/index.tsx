import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack} from 'tamagui'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import LoaderView from '../../../LoaderView'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {finishLoginActionAtom} from './atoms'

type Props = LoginStackScreenProps<'SuccessLogin'>

function SuccessLoginScreen({
  route: {
    params: {verifyPhoneNumberResponse, privateKey, phoneNumber},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const finishLogin = useSetAtom(finishLoginActionAtom)

  useEffect(() => {
    void finishLogin({verifyPhoneNumberResponse, privateKey, phoneNumber})
  }, [finishLogin, phoneNumber, privateKey, verifyPhoneNumberResponse])

  return (
    <Stack f={1} testID="@successLoginScreen">
      <HeaderProxy showBackButton={false} progressNumber={2} hidden />
      <LoaderView text={t('loginFlow.verificationCode.success.title')} />
      <NextButtonProxy text={null} disabled={true} onPress={null} />
    </Stack>
  )
}

export default SuccessLoginScreen

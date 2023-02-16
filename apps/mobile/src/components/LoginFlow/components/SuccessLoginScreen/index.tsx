import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type LoginStackParamsList} from '../../index'
import {useCallback, useEffect} from 'react'
import {useSetSession} from '../../../../state/session'
import reportError from '../../../../utils/reportError'
import {Alert} from 'react-native'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {Session} from '../../../../brands/Session.brand'
import {deserializePrivateKey} from '../../utils'
import LoaderView from '../../../LoaderView'
import NextButtonPortal from '../NextButtonPortal'

type Props = NativeStackScreenProps<LoginStackParamsList, 'SuccessLogin'>

function SuccessLoginScreen({
  navigation,
  route: {
    params: {
      sessionCredentials: sessionCredentialsSerialized,
      phoneNumber,
      realUserData,
      anonymizedUserData,
    },
  },
}: Props): JSX.Element {
  const setSession = useSetSession()
  const {t} = useTranslation()

  const finishLogin = useCallback(() => {
    const privateKey = deserializePrivateKey(
      sessionCredentialsSerialized.privateKey
    )

    const sessionParse = Session.safeParse({
      version: 1,
      sessionCredentials: {
        privateKey,
        hash: sessionCredentialsSerialized.hash,
        signature: sessionCredentialsSerialized.signature,
      },
      realUserData,
      phoneNumber,
      anonymizedUserData,
    })
    if (sessionParse.success) {
      setSession(sessionParse.data)
    } else {
      reportError(
        'error',
        '‼️Error while parsing session for internal state',
        sessionParse.error
      )
      Alert.alert(
        t('loginFlow.success.errorWhileParsingSessionForInternalState')
      )
      navigation.navigate('Start')
    }
  }, [navigation, t])

  useEffect(() => {
    const timeout = setTimeout(finishLogin, 3000)
    return () => {
      clearTimeout(timeout)
    }
  }, [finishLogin])

  return (
    <>
      <LoaderView text={t('loginFlow.verificationCode.success.title')} />
      <NextButtonPortal text={null} disabled={true} />
    </>
  )
}

export default SuccessLoginScreen

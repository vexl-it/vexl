import {useCallback, useEffect} from 'react'
import {useSetSession} from '../../../../state/session'
import reportError from '../../../../utils/reportError'
import {Alert} from 'react-native'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {Session} from '../../../../brands/Session.brand'
import {deserializePrivateKey} from '../../utils'
import LoaderView from '../../../LoaderView'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {useVerifyChallenge} from '../../api/verifyChallenge'
import * as crypto from '@vexl-next/cryptography'
import {safeParse} from '../../../../utils/fpUtils'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {UserSessionCredentials} from '@vexl-next/rest-api/dist/UserSessionCredentials.brand'
import {useCreateUserAtContactMs} from '../../api/createUserAtContactsMS'
import {KeyFormat} from '@vexl-next/cryptography'

type Props = LoginStackScreenProps<'SuccessLogin'>

const TARGET_TIME_MILLISECONDS = 3000

function SuccessLoginScreen({
  navigation,
  route: {
    params: {
      verifyPhoneNumberResponse,
      privateKey: serializedPrivateKey,
      phoneNumber,
      realUserData,
      anonymizedUserData,
    },
  },
}: Props): JSX.Element {
  const setSession = useSetSession()
  const verifyChallenge = useVerifyChallenge()
  const createUserAtContactMs = useCreateUserAtContactMs()
  const {t} = useTranslation()

  const finishLogin = useCallback(() => {
    const startedAt = Date.now()

    void pipe(
      deserializePrivateKey(serializedPrivateKey),
      E.mapLeft((error) => {
        reportError(
          'error',
          'error while deserializing private key got from navigation',
          error
        )
        return t('common.unknownError')
      }),
      E.bindTo('privateKey'),
      E.bindW('signature', ({privateKey}) =>
        E.tryCatch(
          () =>
            crypto.ecdsa.ecdsaSign({
              privateKey,
              challenge: verifyPhoneNumberResponse.challenge,
            }),

          (error) => {
            reportError('error', 'error while signing login challenge', error)
            return t('common.cryptoError')
          }
        )
      ),
      TE.fromEither,
      TE.bindW('verifyChallengeResponse', ({privateKey, signature}) =>
        verifyChallenge({
          userPublicKey: privateKey.exportPublicKey(),
          signature,
        })
      ),
      TE.chainW(({privateKey, signature, verifyChallengeResponse}) => {
        return pipe(
          safeParse(UserSessionCredentials)({
            publicKey: privateKey.exportPublicKey(KeyFormat.PEM_BASE64),
            hash: verifyChallengeResponse.hash,
            signature: verifyChallengeResponse.signature,
          }),
          E.chainW((sessionCredentials) =>
            safeParse(Session)({
              version: 1,
              realUserData,
              anonymizedUserData,
              sessionCredentials,
              phoneNumber,
              privateKey,
            })
          ),
          E.mapLeft((error) => {
            reportError('error', 'Error while creating session', error)
            return t('common.unknownError')
          }),
          TE.fromEither
        )
      }),
      TE.bindTo('session'),
      TE.bindW('_', ({session}) =>
        createUserAtContactMs({firebaseToken: null}, session.sessionCredentials)
      ),
      TE.match(
        (text) => {
          Alert.alert(text)
          navigation.goBack()
        },
        ({session}) => {
          const leftToWait = TARGET_TIME_MILLISECONDS - (Date.now() - startedAt)
          if (leftToWait > 0)
            setTimeout(() => {
              setSession(session)
            }, leftToWait)
          else setSession(session)
        }
      )
    )()
  }, [
    serializedPrivateKey,
    t,
    verifyPhoneNumberResponse.challenge,
    verifyChallenge,
    phoneNumber,
    realUserData,
    anonymizedUserData,
    navigation,
    setSession,
    createUserAtContactMs,
  ])

  useEffect(finishLogin, [finishLogin])

  return (
    <>
      <HeaderProxy showBackButton={false} progressNumber={2} hidden />
      <LoaderView text={t('loginFlow.verificationCode.success.title')} />
      <NextButtonProxy text={null} disabled={true} onPress={null} />
    </>
  )
}

export default SuccessLoginScreen

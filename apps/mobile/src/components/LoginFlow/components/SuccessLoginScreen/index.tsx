import * as crypto from '@vexl-next/cryptography'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useCallback, useEffect} from 'react'
import {Alert} from 'react-native'
import {Session} from '../../../../brands/Session.brand'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useSetSession} from '../../../../state/session'
import {safeParse} from '../../../../utils/fpUtils'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import reportError from '../../../../utils/reportError'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import LoaderView from '../../../LoaderView'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {useCreateUserAtContactMs} from '../../api/createUserAtContactsMS'
import {useVerifyChallenge} from '../../api/verifyChallenge'

type Props = LoginStackScreenProps<'SuccessLogin'>

const TARGET_TIME_MILLISECONDS = 3000

function SuccessLoginScreen({
  route: {
    params: {verifyPhoneNumberResponse, privateKey, phoneNumber},
  },
}: Props): JSX.Element {
  const setSession = useSetSession()
  const verifyChallenge = useVerifyChallenge()
  const createUserAtContactMs = useCreateUserAtContactMs()
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const finishLogin = useCallback(() => {
    const startedAt = Date.now()

    void pipe(
      E.right(privateKey),
      E.bindTo('privateKey'),
      E.bindW('signature', ({privateKey}) =>
        E.tryCatch(
          () =>
            crypto.ecdsa.ecdsaSign({
              privateKey,
              challenge: verifyPhoneNumberResponse.challenge,
            }),

          (error) => {
            reportError(
              'error',
              new Error('error while signing login challenge'),
              {error}
            )
            return t('common.cryptoError')
          }
        )
      ),
      TE.fromEither,
      TE.bindW('verifyChallengeResponse', ({privateKey, signature}) =>
        verifyChallenge({
          userPublicKey: privateKey.publicKeyPemBase64,
          signature,
        })
      ),
      TE.chainW(({privateKey, signature, verifyChallengeResponse}) => {
        return pipe(
          E.right<never, Zod.input<typeof Session>>({
            version: 1,
            sessionCredentials: {
              publicKey: privateKey.publicKeyPemBase64,
              hash: verifyChallengeResponse.hash,
              signature: verifyChallengeResponse.signature,
            },
            phoneNumber,
            privateKey,
          }),
          E.chainW(safeParse(Session)),
          E.mapLeft((error) => {
            reportError('error', new Error('Error while creating session'), {
              error,
            })
            return t('common.unknownError')
          }),
          TE.fromEither
        )
      }),
      TE.bindTo('session'),
      TE.chainFirstW(({session}) =>
        pipe(
          createUserAtContactMs(
            {firebaseToken: null},
            session.sessionCredentials
          )
        )
      ),
      TE.match(
        (text) => {
          Alert.alert(text)
          safeGoBack()
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
    privateKey,
    verifyPhoneNumberResponse.challenge,
    t,
    verifyChallenge,
    phoneNumber,
    createUserAtContactMs,
    safeGoBack,
    setSession,
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

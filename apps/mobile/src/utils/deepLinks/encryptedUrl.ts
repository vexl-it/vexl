import Clipboard from '@react-native-clipboard/clipboard'
import {KeyHolder} from '@vexl-next/cryptography'
import {PrivateKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {askAreYouSureActionAtom} from '../../components/AreYouSureDialog'
import {eciesDecrypt} from '../fpUtils'
import {translationAtom} from '../localization/I18nProvider'
import openUrl from '../openUrl'
import reportError from '../reportError'

const privateKey = KeyHolder.importKeyPair(
  PrivateKeyPemBase64.parse(
    'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0VBZ0VBTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFLQkcwd2F3SUJBUVFndWIyTDJaMFd5YVhvSVZmaUk3b3IKUFZTK2JTOGpGUXpVaUxvUkNjT2N3MnFoUkFOQ0FBU1c2USs4NXRQQ3RjMDFMdU5nZUVMY3ZIZGlDbmErMThOdwpWanpVUXc2T3RvbDdvWW5BMUVzR2tWOUZqdUVURzJzSTBIdG1RQmk0eFlXT3VQVTdRYmNvCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K'
  )
)
export const processEncryptedUrlActionAtom = atom(
  null,
  (get, set, payload: string) => {
    const {t} = get(translationAtom)
    const openAndProcessDialog = (decrypted: string): T.Task<void> =>
      pipe(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          buttonsDirection: 'column-reverse',
          steps: [
            {
              type: 'StepWithText',
              title: t('raffle.popup.title'),
              description: t('raffle.popup.text'),
              positiveButtonText: t('raffle.popup.openApp'),
              negativeButtonText: t('raffle.popup.copyInstead'),
            },
          ],
        }),
        TE.matchW(
          () => {
            Clipboard.setString(decrypted.replace(/^.*:/, ''))
          },
          () => {
            const toCopyInCaseOfFail = decrypted.replace(/^.*:/, '')
            openUrl(decrypted, toCopyInCaseOfFail, {
              errorTitle: t('raffle.errorOpeningApp.title'),
              errorText: t('raffle.errorOpeningApp.text'),
              errorCopyText: t('raffle.errorOpeningApp.button'),
            })()
          }
        )
      )

    void pipe(
      eciesDecrypt(privateKey.privateKeyPemBase64)(payload),

      TE.chainFirstTaskK(openAndProcessDialog),
      TE.matchW(
        (e) => {
          Alert.alert('Error', t('raffle.errorOpeningDeepLink'))
          reportError('warn', new Error('Error opening deep link'), {
            e,
            payload,
          })
        },
        (a) => {
          console.log('Success processing encrypted deep link')
        }
      )
    )()
  }
)

import {type VerifyPhoneNumberRequest} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {verificationCodeErrorMessage} from './verificationCodeErrorMessage'

export const verifyPhoneNumberAtom = atom(
  null,
  (get, _, inputRequest: VerifyPhoneNumberRequest) =>
    get(apiAtom)
      .user.verifyPhoneNumber(inputRequest)
      .pipe(
        Effect.mapError((e) =>
          verificationCodeErrorMessage(e, get(translationAtom).t)
        )
      )
)

import {type GetBackupKeyPairRequest} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {verificationCodeErrorMessage} from './verificationCodeErrorMessage'

export const getBackupKeyPairAtom = atom(
  null,
  (get, _, request: GetBackupKeyPairRequest) =>
    get(apiAtom)
      .user.getBackupKeyPair(request)
      .pipe(
        Effect.map(({keyPair}) => keyPair),
        Effect.mapError((e) =>
          verificationCodeErrorMessage(e, get(translationAtom).t)
        )
      )
)

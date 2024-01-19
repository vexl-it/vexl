import {contact} from '@vexl-next/rest-api'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {type CreateUserRequest} from '@vexl-next/rest-api/src/services/contact/contracts'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {apiEnv, platform} from '../../../api'
import {versionCode} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

export function useCreateUserAtContactMs(): (
  request: CreateUserRequest,
  session: UserSessionCredentials
) => TE.TaskEither<string, void> {
  const {t} = useTranslation()

  return (request: CreateUserRequest, credentials: UserSessionCredentials) => {
    const contactApi = contact.privateApi({
      platform,
      clientVersion: versionCode,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => credentials,
    })

    return pipe(
      contactApi.createUser(request),
      TE.mapLeft((l) => {
        switch (l._tag) {
          case 'UnexpectedApiResponseError':
            return t('common.unexpectedServerResponse')
          case 'NetworkError':
            return toCommonErrorMessage(l, t) ?? t('common.unknownError')
          case 'UnknownError':
          case 'BadStatusCodeError':
            return t('common.unknownError')
        }
      })
    )
  }
}

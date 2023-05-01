import * as TE from 'fp-ts/TaskEither'
import {
  type ImportContactsRequest,
  type ImportContactsResponse,
} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {pipe} from 'fp-ts/function'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'

export function useImportContacts(): (
  r: ImportContactsRequest
) => TE.TaskEither<string, ImportContactsResponse> {
  const {t} = useTranslation()
  const privateApi = usePrivateApiAssumeLoggedIn()

  return (request: ImportContactsRequest) => {
    return pipe(
      privateApi.contact.importContacts(request),
      TE.mapLeft((e) => {
        if (e._tag === 'NetworkError') {
          return toCommonErrorMessage(e, t) ?? t('common.unknownError')
        }
        return t('common.unknownError')
      })
    )
  }
}

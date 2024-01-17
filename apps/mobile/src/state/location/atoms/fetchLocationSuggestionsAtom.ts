import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {pipe} from 'fp-ts/function'
import {
  type GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/src/services/location/contracts'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import reportError from '../../../utils/reportError'
import {translationAtom} from '../../../utils/localization/I18nProvider'

export const fetchLocationSuggestionsAtom = atom(
  null,
  (get, set, request: GetLocationSuggestionsRequest) => {
    const api = get(privateApiAtom)
    const {t} = get(translationAtom)

    return pipe(
      api.location.getLocationSuggestions(request),
      TE.getOrElse((e) => {
        showErrorAlert({
          title:
            toCommonErrorMessage(e, t) ??
            t('offerForm.errorSearchingForAvailableLocation'),
          error: e,
        })
        reportError(
          'error',
          'Error when getting user location to create offer',
          e
        )
        return T.of({result: []} as GetLocationSuggestionsResponse)
      })
    )
  }
)

import {
  type GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/src/services/location/contracts'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

export const fetchLocationSuggestionsAtom = atom(
  null,
  (get, set, request: GetLocationSuggestionsRequest) => {
    const api = get(apiAtom)
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
          new Error('Error when getting user location to create offer'),
          {e}
        )
        return T.of({result: []} as GetLocationSuggestionsResponse)
      })
    )
  }
)

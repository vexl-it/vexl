import {useSetAtom} from 'jotai'
import React from 'react'
import {dismissImportContactsInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import DismissableMarketplaceBanner from './DismissableMarketplaceBanner'
import useAddContactsFromMarketplaceAction from './useAddContactsFromMarketplaceAction'

function ImportContactsMarketplaceSuggestion(): React.ReactElement {
  const {t} = useTranslation()
  const dismissImportContactsSuggestion = useSetAtom(
    dismissImportContactsInMarketplaceSuggestionActionAtom
  )
  const addContacts = useAddContactsFromMarketplaceAction()

  return (
    <DismissableMarketplaceBanner
      color="pink"
      title={t('marketplace.importContactsSuggestion.title')}
      description={t('marketplace.importContactsSuggestion.description')}
      primaryButton={{
        label: t('marketplace.importContactsSuggestion.button'),
        onPress: () => {
          dismissImportContactsSuggestion()
          addContacts()
        },
      }}
      secondaryButton={{
        label: t('marketplace.importContactsSuggestion.dismiss'),
        onPress: () => {
          dismissImportContactsSuggestion()
        },
      }}
    />
  )
}

export default ImportContactsMarketplaceSuggestion

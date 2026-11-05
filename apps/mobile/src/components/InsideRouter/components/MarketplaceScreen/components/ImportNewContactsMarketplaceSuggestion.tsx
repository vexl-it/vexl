import {useNavigation} from '@react-navigation/native'
import {Banner} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {dismissImportNewContactsInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function ImportNewContactsMarketplaceSuggestion(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const dismissImportNewContactsSuggestion = useSetAtom(
    dismissImportNewContactsInMarketplaceSuggestionActionAtom
  )

  return (
    <Banner
      dismissible
      color="pink"
      title={t('marketplace.importNewContactsSuggestion.title')}
      description={t('marketplace.importNewContactsSuggestion.description')}
      primaryButton={{
        label: t('marketplace.importNewContactsSuggestion.button'),
        onPress: () => {
          dismissImportNewContactsSuggestion()
          navigation.navigate('ContactPreferences', {filter: 'new'})
        },
      }}
      secondaryButton={{
        label: t('marketplace.importNewContactsSuggestion.dismiss'),
        onPress: () => {
          dismissImportNewContactsSuggestion()
        },
      }}
    />
  )
}

export default ImportNewContactsMarketplaceSuggestion

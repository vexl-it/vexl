import {useNavigation} from '@react-navigation/native'
import {Banner} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {dismissCreateOfferInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function CreateOfferMarketplaceSuggestion(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const dismissCreateOfferSuggestion = useSetAtom(
    dismissCreateOfferInMarketplaceSuggestionActionAtom
  )

  return (
    <Banner
      dismissible
      color="pink"
      title={t('marketplace.createOfferSuggestion.title')}
      description={t('marketplace.createOfferSuggestion.description')}
      primaryButton={{
        label: t('marketplace.createOfferSuggestion.button'),
        onPress: () => {
          dismissCreateOfferSuggestion()
          navigation.navigate('CRUDOfferFlow')
        },
      }}
      secondaryButton={{
        label: t('marketplace.createOfferSuggestion.dismiss'),
        onPress: () => {
          dismissCreateOfferSuggestion()
        },
      }}
    />
  )
}

export default CreateOfferMarketplaceSuggestion

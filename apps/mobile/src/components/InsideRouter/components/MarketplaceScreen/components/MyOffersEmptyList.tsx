import {useNavigation} from '@react-navigation/native'
import {EmptyState} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function MyOffersEmptyList(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const onCreateOfferPress = useCallback(() => {
    navigation.navigate('CRUDOfferFlow')
  }, [navigation])

  return (
    <EmptyState
      paddingHorizontal="$5"
      title={t('marketplace.postYourFirstOffer')}
      description={t('marketplace.createOfferDescription')}
      action={{
        label: t('marketplace.createNewOffer'),
        onPress: onCreateOfferPress,
      }}
    />
  )
}

export default MyOffersEmptyList

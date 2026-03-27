import {useNavigation} from '@react-navigation/native'
import {Button, Typography} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function MyOffersEmptyList(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const onCreateOfferPress = useCallback(() => {
    navigation.navigate('CRUDOfferFlow', {screen: 'ListingAndOfferType'})
  }, [navigation])

  return (
    <Stack paddingTop="$10" paddingHorizontal="$5" gap="$7">
      <Typography
        variant="heading3"
        color="$foregroundPrimary"
        textAlign="center"
      >
        {t('marketplace.postYourFirstOffer')}
      </Typography>
      <Typography
        variant="description"
        color="$foregroundSecondary"
        textAlign="center"
      >
        {t('marketplace.createOfferDescription')}
      </Typography>
      <Button variant="tertiary" size="small" onPress={onCreateOfferPress}>
        {t('marketplace.createNewOffer')}
      </Button>
    </Stack>
  )
}

export default MyOffersEmptyList

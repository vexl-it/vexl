import {useNavigation} from '@react-navigation/native'
import React from 'react'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../../EmptyListWrapper'

function MyOffersEmptyList(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <Stack f={1} pt="$6">
      <EmptyListWrapper
        buttonText={t('myOffers.addNewOffer')}
        onButtonPress={() => {
          navigation.navigate('CRUDOfferFlow', {
            screen: 'ListingAndOfferType',
          })
        }}
      >
        <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
          {t('myOffers.youHaveNotPostedAnyOffers')}
        </Text>
      </EmptyListWrapper>
    </Stack>
  )
}

export default MyOffersEmptyList

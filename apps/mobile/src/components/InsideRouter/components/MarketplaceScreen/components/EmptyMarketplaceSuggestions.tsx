import {useNavigation} from '@react-navigation/native'
import {useAtom} from 'jotai'
import {ScrollView} from 'react-native'
import {YStack} from 'tamagui'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import MarketplaceSuggestion from './MarketplaceSuggestion'

function EmptyMarketplaceSuggestions(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()
  const [createOfferSuggestionVisible, setCreateOfferSuggestionVisible] =
    useAtom(createOfferSuggestionVisibleAtom)
  const [
    addMoreContactsSuggestionVisible,
    setAddMoreContactsSuggestionVisible,
  ] = useAtom(addMoreContactsSuggestionVisibleAtom)

  return (
    <ScrollView contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}>
      <YStack mt="$4" space="$4">
        {createOfferSuggestionVisible && (
          <MarketplaceSuggestion
            buttonText={t('myOffers.addNewOffer')}
            onButtonPress={() => {
              navigation.navigate('CreateOffer')
            }}
            onClosePress={() => {
              setCreateOfferSuggestionVisible(false)
            }}
            text={t('suggestion.createYourFirstOffer')}
          />
        )}
        {addMoreContactsSuggestionVisible && (
          <MarketplaceSuggestion
            buttonText={t('suggestion.addMoreContacts')}
            onButtonPress={() => {
              navigation.navigate('SetContacts', {})
            }}
            onClosePress={() => {
              setAddMoreContactsSuggestionVisible(false)
            }}
            text={t('suggestion.noOffersFromOthersYet')}
          />
        )}
        <ImportNewContactsSuggestion />
      </YStack>
    </ScrollView>
  )
}

export default EmptyMarketplaceSuggestions

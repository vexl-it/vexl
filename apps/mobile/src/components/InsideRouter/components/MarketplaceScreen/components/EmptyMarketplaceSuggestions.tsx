import {useNavigation} from '@react-navigation/native'
import {RefreshControl, ScrollView} from 'react-native'
import {YStack} from 'tamagui'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import MarketplaceSuggestion from './MarketplaceSuggestion'

interface Props {
  refreshing: boolean
  onRefresh?: () => void
}

function EmptyMarketplaceSuggestions({
  refreshing,
  onRefresh,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
    >
      <YStack mt="$4" space="$4">
        <MarketplaceSuggestion
          buttonText={t('myOffers.addNewOffer')}
          onButtonPress={() => {
            navigation.navigate('CreateOffer')
          }}
          text={t('suggestion.createYourFirstOffer')}
          visibleStateAtom={createOfferSuggestionVisibleAtom}
        />
        <MarketplaceSuggestion
          buttonText={t('suggestion.addMoreContacts')}
          onButtonPress={() => {
            navigation.navigate('SetContacts', {})
          }}
          text={t('suggestion.noOffersFromOthersYet')}
          visibleStateAtom={addMoreContactsSuggestionVisibleAtom}
        />
        <ImportNewContactsSuggestion />
      </YStack>
    </ScrollView>
  )
}

export default EmptyMarketplaceSuggestions

import {useNavigation} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import {RefreshControl, ScrollView} from 'react-native'
import {YStack} from 'tamagui'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
  joinVexlClubsSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {showClubsFlowAtom} from '../../../../../utils/preferences'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import VexlNewsSuggestions from './VexlNewsSuggestions'

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
  const showClubsFlow = useAtomValue(showClubsFlowAtom)

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
    >
      <YStack mt="$4" gap="$6">
        <VexlNewsSuggestions />
        <MarketplaceSuggestion
          buttonText={t('myOffers.addNewOffer')}
          onButtonPress={() => {
            navigation.navigate('CRUDOfferFlow', {
              screen: 'ListingAndOfferType',
            })
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
        {!!showClubsFlow && (
          <MarketplaceSuggestion
            buttonText={t('suggestion.whatAreClubs')}
            onButtonPress={() => {
              navigation.navigate('Faqs', {
                pageType: 'WHAT_ARE_VEXL_CLUBS',
              })
            }}
            text={t('suggestion.yourReachIsTooLow')}
            visibleStateAtom={joinVexlClubsSuggestionVisibleAtom}
          />
        )}
        <ImportNewContactsSuggestion />
      </YStack>
    </ScrollView>
  )
}

export default EmptyMarketplaceSuggestions

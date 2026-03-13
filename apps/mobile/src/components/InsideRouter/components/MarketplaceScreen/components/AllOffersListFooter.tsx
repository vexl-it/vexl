import {useNavigation} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack} from 'tamagui'
import {minutesTillOffersDisplayedAtom} from '../../../../../state/contacts'
import {joinVexlClubsSuggestionVisibleAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

function AllOffersListFooter(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const minutesTillOffersDisplayed = useAtomValue(
    minutesTillOffersDisplayedAtom
  )

  if (minutesTillOffersDisplayed >= 0) return null

  return (
    <Stack mt="$4">
      <MarketplaceSuggestion
        buttonText={t('suggestion.whatAreClubs')}
        onButtonPress={() => {
          navigation.navigate('Faqs', {
            pageType: 'WHAT_ARE_VEXL_CLUBS',
          })
        }}
        text={t('suggestion.lookingForMoreoffers')}
        visibleStateAtom={joinVexlClubsSuggestionVisibleAtom}
      />
    </Stack>
  )
}

export default AllOffersListFooter

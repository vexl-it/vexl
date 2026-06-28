import {useNavigation} from '@react-navigation/native'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {myProductOffersMissingCategoryAtom} from '../../../../../state/marketplace/atoms/myOffers'
import {dismissMissingProductCategoriesInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import DismissableMarketplaceBanner from './DismissableMarketplaceBanner'

function MissingProductCategoriesMarketplaceSuggestion({
  placement,
}: {
  readonly placement: 'allOffers' | 'myOffers'
}): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const dismissMissingProductCategoriesSuggestion = useSetAtom(
    dismissMissingProductCategoriesInMarketplaceSuggestionActionAtom
  )
  const missingProductCategoryOffers = useAtomValue(
    myProductOffersMissingCategoryAtom
  )
  const affectedOffersCount = missingProductCategoryOffers.length
  const firstOfferMissingCategory = pipe(
    missingProductCategoryOffers,
    Array.head,
    Option.getOrUndefined
  )

  if (!firstOfferMissingCategory) return null

  const hasSingleAffectedOffer = affectedOffersCount === 1
  const descriptionKey =
    placement === 'allOffers'
      ? hasSingleAffectedOffer
        ? 'marketplace.missingProductCategoriesSuggestion.allOffersDescriptionSingular'
        : 'marketplace.missingProductCategoriesSuggestion.allOffersDescriptionPlural'
      : hasSingleAffectedOffer
        ? 'marketplace.missingProductCategoriesSuggestion.myOffersDescriptionSingular'
        : 'marketplace.missingProductCategoriesSuggestion.myOffersDescriptionPlural'
  const primaryButtonLabelKey =
    placement === 'allOffers'
      ? 'marketplace.missingProductCategoriesSuggestion.allOffersPrimaryButton'
      : hasSingleAffectedOffer
        ? 'marketplace.missingProductCategoriesSuggestion.myOffersPrimaryButtonSingular'
        : 'marketplace.missingProductCategoriesSuggestion.myOffersPrimaryButtonPlural'

  return (
    <DismissableMarketplaceBanner
      color="pink"
      title={t('marketplace.missingProductCategoriesSuggestion.title')}
      description={t(descriptionKey, {count: affectedOffersCount})}
      primaryButton={{
        label: t(primaryButtonLabelKey),
        onPress: () => {
          dismissMissingProductCategoriesSuggestion()

          if (placement === 'allOffers') {
            navigation.navigate('InsideTabs', {
              screen: 'Marketplace',
              params: {
                initialTab: 'myOffers',
                tabSwitchRequestId: String(Date.now()),
              },
            })
          } else {
            navigation.navigate('MyOfferDetail', {
              offerId: firstOfferMissingCategory.offerInfo.offerId,
            })
          }
        },
      }}
      secondaryButton={{
        label: t('common.close'),
        onPress: dismissMissingProductCategoriesSuggestion,
      }}
    />
  )
}

export default MissingProductCategoriesMarketplaceSuggestion

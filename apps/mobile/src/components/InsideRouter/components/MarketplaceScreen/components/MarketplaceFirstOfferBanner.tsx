import React from 'react'
import CreateOfferMarketplaceSuggestion from './CreateOfferMarketplaceSuggestion'
import EnableBackgroundRefreshMarketplaceSuggestion from './EnableBackgroundRefreshMarketplaceSuggestion'
import EnableNotificationsMarketplaceSuggestion from './EnableNotificationsMarketplaceSuggestion'
import ImportContactsMarketplaceSuggestion from './ImportContactsMarketplaceSuggestion'
import ImportNewContactsMarketplaceSuggestion from './ImportNewContactsMarketplaceSuggestion'
import MissingProductCategoriesMarketplaceSuggestion from './MissingProductCategoriesMarketplaceSuggestion'

interface Props {
  readonly marketplaceFirstOfferBanner:
    | 'missingProductCategories'
    | 'importNewContacts'
    | 'importContacts'
    | 'enableNotifications'
    | 'enableBackgroundRefresh'
    | 'createOffer'
}

function MarketplaceFirstOfferBanner({
  marketplaceFirstOfferBanner,
}: Props): React.ReactElement {
  if (marketplaceFirstOfferBanner === 'importNewContacts') {
    return <ImportNewContactsMarketplaceSuggestion />
  }

  if (marketplaceFirstOfferBanner === 'importContacts') {
    return <ImportContactsMarketplaceSuggestion />
  }

  if (marketplaceFirstOfferBanner === 'missingProductCategories') {
    return (
      <MissingProductCategoriesMarketplaceSuggestion placement="allOffers" />
    )
  }

  if (marketplaceFirstOfferBanner === 'enableNotifications') {
    return <EnableNotificationsMarketplaceSuggestion />
  }

  if (marketplaceFirstOfferBanner === 'enableBackgroundRefresh') {
    return <EnableBackgroundRefreshMarketplaceSuggestion />
  }

  return <CreateOfferMarketplaceSuggestion />
}

export default MarketplaceFirstOfferBanner

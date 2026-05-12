import {MarketplaceIntroDialogContent} from '@vexl-next/ui'
import {Effect} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {showMarketplaceIntroDialogAtom} from '../../../utils/preferences'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from './offersToSeeInMarketplace'

export const showMarketplaceIntroDialogIfNeededActionAtom = atom(
  null,
  (get, set) => {
    const shouldShowMarketplaceIntroDialog = get(showMarketplaceIntroDialogAtom)
    const areThereOffersWithoutFilters = get(
      areThereOffersToSeeInMarketplaceWithoutFiltersAtom
    )

    if (!shouldShowMarketplaceIntroDialog || !areThereOffersWithoutFilters) {
      return Effect.succeed(false)
    }

    const {t} = get(translationAtom)
    const description = t('marketplace.introDialog.description')

    set(showMarketplaceIntroDialogAtom, false)

    return Effect.gen(function* (_) {
      yield* _(
        set(globalDialogAtom, {
          title: t('marketplace.introDialog.title'),
          positiveButtonText: t('common.gotIt'),
          children: React.createElement(MarketplaceIntroDialogContent, {
            description,
          }),
        }),
        Effect.ignore
      )

      return true
    })
  }
)

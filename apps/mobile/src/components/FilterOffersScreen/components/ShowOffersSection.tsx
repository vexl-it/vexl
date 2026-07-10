import {RadioGroup, RowRadiobutton, YStack} from '@vexl-next/ui'
import {useAtom} from 'jotai'
import React from 'react'
import {MarketplaceVisibleSection} from '../../../state/marketplace/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {visibleSectionAtom} from '../atom'

function ShowOffersSection(): React.ReactElement {
  const {t} = useTranslation()
  const [visibleSection, setVisibleSection] = useAtom(visibleSectionAtom)

  return (
    <RadioGroup
      allowedValues={MarketplaceVisibleSection.literals}
      value={visibleSection}
      onValueChange={setVisibleSection}
    >
      <YStack gap="$3">
        <RowRadiobutton value="ALL" label={t('filterOffers.showAllOffers')} />
        <RowRadiobutton
          value="ONLY_FAVOURITES"
          label={t('filterOffers.showOnlyFavorites')}
        />
        <RowRadiobutton
          value="ONLY_ARCHIVED"
          label={t('filterOffers.showOnlyArchived')}
        />
      </YStack>
    </RadioGroup>
  )
}

export default ShowOffersSection

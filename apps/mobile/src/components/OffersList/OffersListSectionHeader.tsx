import {Stack, Typography} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type MarketplaceSection} from './domain'

function OffersListSectionHeader({
  section,
}: {
  readonly section: MarketplaceSection
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack px="$5">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        {t(`marketplace.section.${section}`)}
      </Typography>
    </Stack>
  )
}

export default React.memo(OffersListSectionHeader)

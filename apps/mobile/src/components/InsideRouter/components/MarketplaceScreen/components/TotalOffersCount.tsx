import {Typography} from '@vexl-next/ui'
import React from 'react'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

interface Props {
  filteredOffersCount: number
}

function TotalOffersCount({filteredOffersCount}: Props): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack als="flex-start" my="$2">
      <Typography variant="description" color="$greyOnBlack">
        {t('marketplace.offersCount', {count: filteredOffersCount})}
      </Typography>
    </Stack>
  )
}

export default TotalOffersCount

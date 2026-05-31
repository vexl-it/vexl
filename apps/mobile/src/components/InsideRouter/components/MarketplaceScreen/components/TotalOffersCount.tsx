import {Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'

interface Props {
  filteredOffersCount: number
}

function TotalOffersCount({filteredOffersCount}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  return (
    <Stack als="flex-start" my="$2">
      <Typography variant="description" color="$foregroundSecondary">
        {t('marketplace.offersCountFormatted', {
          localizedString: formatInteger(filteredOffersCount, locale),
        })}
      </Typography>
    </Stack>
  )
}

export default TotalOffersCount

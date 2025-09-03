import React from 'react'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'

function NothingFound(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack f={1} ai="center" jc="center">
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        textAlign="center"
        fos={24}
        ff="$heading"
        col="$greyOnWhite"
        mb="$1"
      >
        {t('common.nothingFound')}
      </Text>
    </Stack>
  )
}

export default NothingFound

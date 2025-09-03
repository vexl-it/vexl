import React from 'react'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import anonymousAvatarSadNoBackgroundSvg from '../../images/anonymousAvatarSadNoBackgroundSvg'

function EmptyListPlaceholder(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack f={1} ai="center" jc="center">
      <Image source={anonymousAvatarSadNoBackgroundSvg} />
      <Text textAlign="center" col="$greyOnWhite" fos={20}>
        {t('donations.noDonationsYet')}
      </Text>
    </Stack>
  )
}

export default EmptyListPlaceholder

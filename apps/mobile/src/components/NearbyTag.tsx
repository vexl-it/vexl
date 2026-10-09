import {PinGeolocation, TextTag, useTheme} from '@vexl-next/ui'
import React from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'

export default function NearbyTag(): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <TextTag
      variant="neutral"
      flexShrink={0}
      icon={
        <PinGeolocation
          size={getTokens().size.$4.val}
          color={theme.foregroundSecondary.get()}
        />
      }
      label={t('offer.nearby')}
    />
  )
}

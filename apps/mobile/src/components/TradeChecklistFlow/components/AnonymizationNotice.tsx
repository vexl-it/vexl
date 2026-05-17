import {EyeOpen, Typography, XStack, useTheme} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'

function AnonymizationNotice(
  props: React.ComponentProps<typeof XStack>
): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <XStack ai="center" jc="center" mb="$2" {...props}>
      <EyeOpen size={24} color={theme.foregroundTertiary.get()} />
      <Typography variant="description" color="$foregroundTertiary" ml="$4">
        {t('tradeChecklist.notVisibleToAnyoneNotice')}
      </Typography>
    </XStack>
  )
}

export default AnonymizationNotice

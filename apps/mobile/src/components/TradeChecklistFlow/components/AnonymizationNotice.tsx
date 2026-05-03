import {Typography} from '@vexl-next/ui'
import React from 'react'
import {useTheme, XStack, type XStackProps} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import eyeSvg from '../../images/eyeSvg'

function AnonymizationNotice(props: XStackProps): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <XStack ai="center" jc="center" mb="$2" {...props}>
      <Image stroke={theme.foregroundTertiary.val} source={eyeSvg} />
      <Typography variant="description" color="$foregroundTertiary" ml="$4">
        {t('tradeChecklist.notVisibleToAnyoneNotice')}
      </Typography>
    </XStack>
  )
}

export default AnonymizationNotice

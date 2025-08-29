import React, {type ComponentProps} from 'react'
import {Stack, Text, getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import eyeSvg from '../../images/eyeSvg'

interface Props {
  style?: ComponentProps<typeof Stack>['style']
  fontSize?: number
  text?: string
}

function AnonymizationCaption({
  style,
  fontSize,
  text,
}: Props): React.ReactElement {
  const {t} = useTranslation()

  const textToDisplay = text ?? t('loginFlow.anonymityNotice')

  return (
    <Stack ai="center" jc="flex-start" fd="row" style={style}>
      <Stack mr="$2">
        <Image source={eyeSvg} stroke={getTokens().color.greyOnWhite.val} />
      </Stack>
      <Stack fs={1}>
        <Text col="$greyOnWhite" ff="$body500" fos={fontSize ?? 14}>
          {textToDisplay}
        </Text>
      </Stack>
    </Stack>
  )
}

export default AnonymizationCaption

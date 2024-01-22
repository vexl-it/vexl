import React from 'react'
import {Text, XStack, getTokens, type StackProps} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import eyeSvg from '../../images/eyeSvg'

function AnonymizationNotice(props: StackProps): JSX.Element {
  const {t} = useTranslation()

  return (
    <XStack ai="center" jc="center" mb="$2" {...props}>
      <Image stroke={getTokens().color.greyOnWhite.val} source={eyeSvg} />
      <Text fos={14} ff="$body500" ml="$2" col="$greyOnWhite">
        {t('tradeChecklist.notVisibleToAnyoneNotice')}
      </Text>
    </XStack>
  )
}

export default AnonymizationNotice

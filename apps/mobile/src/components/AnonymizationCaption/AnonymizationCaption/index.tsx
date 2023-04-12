import {useTranslation} from '../../../utils/localization/I18nProvider'
import {type StyleProp, type ViewStyle} from 'react-native'
import Image from '../../Image'
import eyeSvg from './image/eyeSvg'
import {Stack, Text} from 'tamagui'

interface Props {
  style?: StyleProp<ViewStyle>
  fontSize?: number
  text?: string
}

function AnonymizationCaption({style, fontSize, text}: Props): JSX.Element {
  const {t} = useTranslation()

  const textToDisplay = text ?? t('loginFlow.anonymityNotice')

  return (
    <Stack ai="center" jc="flex-start" fd="row" style={style}>
      <Stack mr="$2">
        <Image source={eyeSvg} />
      </Stack>
      <Stack fs={1}>
        <Text col="$greyOnWhite" fos={fontSize ?? 14}>
          {textToDisplay}
        </Text>
      </Stack>
    </Stack>
  )
}

export default AnonymizationCaption

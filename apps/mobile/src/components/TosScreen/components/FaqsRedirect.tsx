import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import playSvg from '../images/playSvg'
import {Stack, Text} from 'tamagui'
import {TouchableOpacity} from 'react-native'
interface Props {
  onPress: () => void
}

function FaqsRedirect({onPress}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <TouchableOpacity onPress={onPress}>
      <Stack fd="row" ai="center" br="$4" bg="$darkBrown" p="$3">
        <Image source={playSvg} />
        <Stack fs={1}>
          <Text ml="$2" fontSize={18} color="$main" ff="$body500">
            {t('termsOfUse.dontHaveTime')}
          </Text>
        </Stack>
      </Stack>
    </TouchableOpacity>
  )
}

export default FaqsRedirect

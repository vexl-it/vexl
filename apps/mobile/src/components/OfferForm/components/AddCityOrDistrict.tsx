import {
  TouchableWithoutFeedback,
  type TouchableWithoutFeedbackProps,
} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import magnifyingGlass from '../../images/magnifyingGlass'

function AddCityOrDistrict(props: TouchableWithoutFeedbackProps): JSX.Element {
  const {t} = useTranslation()

  return (
    <TouchableWithoutFeedback {...props}>
      <XStack ai="center" p="$5" bc="$grey" br="$5">
        <Stack h={24} w={24}>
          <SvgImage
            stroke={getTokens().color.white.val}
            source={magnifyingGlass}
          />
        </Stack>
        <Text ml="$4" ff="$body500" fos={18} col="$greyOnBlack">
          {t('offerForm.location.addCityOrDistrict')}
        </Text>
      </XStack>
    </TouchableWithoutFeedback>
  )
}

export default AddCityOrDistrict

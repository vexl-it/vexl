import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {Stack, Text} from 'tamagui'
import {TouchableWithoutFeedback} from 'react-native'

function BuySellHeader(): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack>
      <TouchableWithoutFeedback>
        <Text fos={40} ff="$heading" col="$main">
          {t('offer.sell')}
        </Text>
        <Stack />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback>
        <Text fos={40} ff="$heading" col="$greyOnWhite">
          {t('offer.buy')}
        </Text>
        <Stack />
      </TouchableWithoutFeedback>
    </Stack>
  )
}

export default BuySellHeader

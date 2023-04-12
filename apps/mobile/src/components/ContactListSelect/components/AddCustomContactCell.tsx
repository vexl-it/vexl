import Image from '../../Image'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import addSvg from '../image/addSvg'
import {Stack, Text} from 'tamagui'

function AddCustomContactCell({
  numberToAdd,
}: {
  numberToAdd: string
}): JSX.Element {
  const {t} = useTranslation()
  return (
    <Stack>
      <Image source={addSvg} />
      <Text>{t('contactsList.addContact', {numberToAdd})}</Text>
    </Stack>
  )
}

export default AddCustomContactCell

import {useTranslation} from '../../../utils/localization/I18nProvider'
import {Stack, Text} from 'tamagui'

function NothingFound(): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack f={1} ai="center" jc="center">
      <Text fos={24} ff="$heading" col="$greyOnWhite">
        {t('postLoginFlow.contactsList.nothingFound.title')}
      </Text>
      <Text fos={14} ta="center" col="$greyOnWhite">
        {t('postLoginFlow.contactsList.nothingFound.text')}
      </Text>
    </Stack>
  )
}

export default NothingFound

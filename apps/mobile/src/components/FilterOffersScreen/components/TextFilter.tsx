import {Stack} from 'tamagui'
import {useAtomValue} from 'jotai'
import MockedTouchableTextInput from '../../MockedTouchableTextInput'
import {useNavigation} from '@react-navigation/native'
import {focusTextFilterAtom} from '../atom'
import {useTranslation} from '../../../utils/localization/I18nProvider'

function TextFilter(): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()
  const searchText = useAtomValue(focusTextFilterAtom)

  return (
    <Stack>
      <MockedTouchableTextInput
        onPress={() => {
          navigation.navigate('SearchOffers')
        }}
        text={searchText ?? ''}
        placeholder={t('filterOffers.noTextFilter')}
      />
    </Stack>
  )
}

export default TextFilter

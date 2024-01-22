import {useNavigation} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import MockedTouchableTextInput from '../../MockedTouchableTextInput'
import {focusTextFilterAtom} from '../atom'

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

import WhiteContainer from '../../../WhiteContainer'
import TextInput from '../../../Input'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useState} from 'react'
import {UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {Alert} from 'react-native'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {Stack, Text} from 'tamagui'

type Props = LoginStackScreenProps<'Name'>

function NameScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [value, setValue] = useState('')

  return (
    <Stack f={1}>
      <HeaderProxy showBackButton={true} progressNumber={1} />
      <WhiteContainer>
        <Text ff="$heading" fos={24} numberOfLines={2} adjustsFontSizeToFit>
          {t('loginFlow.name.prompt')}
        </Text>
        <Stack my="$4">
          <TextInput
            value={value}
            placeholder={t('loginFlow.name.placeholder')}
            onChangeText={(e) => {
              setValue(e)
            }}
          />
        </Stack>
        <AnonymizationCaption />
      </WhiteContainer>
      <NextButtonProxy
        disabled={!value.trim()}
        onPress={() => {
          const validation = UserName.safeParse(value.trim())
          if (!validation.success) {
            Alert.alert(t('loginFlow.name.nameValidationError'))
            return
          }
          navigation.navigate('Photo', {userName: validation.data})
        }}
        text={t('common.save')}
      />
    </Stack>
  )
}

export default NameScreen

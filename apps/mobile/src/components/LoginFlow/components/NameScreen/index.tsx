import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import React, {useState} from 'react'
import {Alert} from 'react-native'
import {Stack, Text} from 'tamagui'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import TextInput from '../../../Input'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {WhiteContainerWithScroll} from '../../../WhiteContainer'

type Props = LoginStackScreenProps<'Name'>

const USERNAME_MAX_LENGTH = 25

function NameScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [value, setValue] = useState('')

  return (
    <Stack f={1}>
      <HeaderProxy showBackButton={true} progressNumber={1} />
      <WhiteContainerWithScroll>
        <Text
          col="$black"
          ff="$heading"
          fos={24}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {t('loginFlow.name.prompt')}
        </Text>
        <Stack my="$4" mx="$-4">
          <TextInput
            maxLength={USERNAME_MAX_LENGTH}
            value={value}
            placeholder={t('loginFlow.name.placeholder')}
            onChangeText={(e) => {
              setValue(e)
            }}
          />
        </Stack>
        <AnonymizationCaption />
      </WhiteContainerWithScroll>
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

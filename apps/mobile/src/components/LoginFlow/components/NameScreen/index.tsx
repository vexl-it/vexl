import {TitleText} from '../../../Text'
import styled from '@emotion/native'
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

const RootContainer = styled.View`
  flex: 1;
`

const WhiteContainerStyled = styled(WhiteContainer)``

const TitleStyled = styled(TitleText)``

const TextInputStyled = styled(TextInput)`
  margin-top: 16px;
  margin-bottom: 16px;
`

type Props = LoginStackScreenProps<'Name'>

function NameScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [value, setValue] = useState('')

  return (
    <RootContainer>
      <HeaderProxy showBackButton={true} progressNumber={1} />
      <WhiteContainerStyled>
        <TitleStyled numberOfLines={2} adjustsFontSizeToFit>
          {t('loginFlow.name.prompt')}
        </TitleStyled>
        <TextInputStyled
          value={value}
          placeholder={t('loginFlow.name.placeholder')}
          onChangeText={(e) => {
            setValue(e)
          }}
        />
        <AnonymizationCaption />
      </WhiteContainerStyled>
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
        text={t('common.continue')}
      />
    </RootContainer>
  )
}

export default NameScreen

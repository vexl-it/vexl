import {TitleText} from '../../../Text'
import styled from '@emotion/native'
import WhiteContainer from '../../../WhiteContainer'
import TextInput from '../../../Input'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../AnonymizationCaption'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type LoginStackParamsList} from '../../index'
import {useCallback, useState} from 'react'
import {UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {Alert} from 'react-native'
import NextButtonPortal from '../NextButtonPortal'
import {useSetHeaderState} from '../../state/headerStateAtom'

const RootContainer = styled.View`
  flex: 1;
`

const WhiteContainerStyled = styled(WhiteContainer)``

const TitleStyled = styled(TitleText)``

const TextInputStyled = styled(TextInput)`
  margin-top: 16px;
  margin-bottom: 16px;
`

type Props = NativeStackScreenProps<LoginStackParamsList, 'Name'>

function NameScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [value, setValue] = useState('')

  useSetHeaderState(
    useCallback(
      () => ({
        showBackButton: true,
        progressNumber: 1,
      }),
      []
    )
  )

  return (
    <RootContainer>
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
      <NextButtonPortal
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

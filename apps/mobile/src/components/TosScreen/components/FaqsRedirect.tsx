import styled from '@emotion/native'
import {TouchableOpacity} from 'react-native'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import playSvg from '../images/playSvg'
import Text from '../../Text'

interface Props {
  onPress: () => void
}

const PressableStyled = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  border-radius: 10px;
  background-color: #322717;
  padding: ${(p) => String(p.theme.spacings.small)}px;
`

const RedirectText = styled(Text)`
  font-size: 18px;
  margin-left: 12px;
`

const TextContainer = styled.View`
  flex-shrink: 1;
`

function FaqsRedirect({onPress}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <PressableStyled onPress={onPress}>
      <Image source={playSvg} />
      <TextContainer>
        <RedirectText colorStyle="goldOnYellow" fontWeight={500}>
          {t('termsOfUse.dontHaveTime')}
        </RedirectText>
      </TextContainer>
    </PressableStyled>
  )
}

export default FaqsRedirect

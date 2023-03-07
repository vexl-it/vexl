import styled from '@emotion/native'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Text from '../../Text'

const RootContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`
const TextStyled = styled(Text)`
  font-size: 14px;
  text-align: center;
`

const TitleStyled = styled(Text)`
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 18px;
  text-align: center;
`

function NothingFound(): JSX.Element {
  const {t} = useTranslation()

  return (
    <RootContainer>
      <TitleStyled colorStyle="grayOnWhite">
        {t('postLoginFlow.contactsList.nothingFound.title')}
      </TitleStyled>
      <TextStyled colorStyle="grayOnWhite">
        {t('postLoginFlow.contactsList.nothingFound.text')}
      </TextStyled>
    </RootContainer>
  )
}

export default NothingFound

import {useTranslation} from '../../../utils/localization/I18nProvider'
import styled from '@emotion/native'
import Text from '../../Text'

const RootContainer = styled.View`
  margin-top: 8px;
  margin-bottom: 16px;
`

const TextStyled = styled(Text)`
  font-size: 14px;
  text-align: center;
`

function ListHeader(): JSX.Element {
  const {t} = useTranslation()

  return (
    <RootContainer>
      <TextStyled colorStyle="grayOnWhite">
        {t('postLoginFlow.contactsList.toAddCustomContact')}
      </TextStyled>
    </RootContainer>
  )
}

export default ListHeader

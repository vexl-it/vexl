import styled from '@emotion/native'
import {TitleText} from '../../../../Text'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

const RootContainer = styled.View``
const TitleContainer = styled.TouchableWithoutFeedback``
const Title = styled(TitleText)<{active: boolean}>`
  color: ${({active, theme}) =>
    active ? theme.colors.grayOnWhite : theme.colors.main};
  font-size: 40px; // TODO resize on screen size
`
const BottomLine = styled.View``

function BuySellHeader(): JSX.Element {
  const {t} = useTranslation()

  return (
    <RootContainer>
      <TitleContainer>
        <Title active={false}>{t('offer.sell')}</Title>
        <BottomLine />
      </TitleContainer>
      <TitleContainer>
        <Title active={true}>{t('offer.buy')}</Title>
        <BottomLine />
      </TitleContainer>
    </RootContainer>
  )
}

export default BuySellHeader

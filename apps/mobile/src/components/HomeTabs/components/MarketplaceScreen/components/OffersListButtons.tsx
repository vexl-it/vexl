import styled from '@emotion/native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import addIconSvg from '../../../../../images/addIconSvg'

const RootContainer = styled.View`
  margin: 16px 8px 0;
  flex-direction: row;
  justify-content: space-between;
`
const RightGroup = styled.View`
  flex-direction: row;
`
const ButtonSpacer = styled.View`
  width: 8px;
`

function OffersListButtons(): JSX.Element {
  const {t} = useTranslation()
  return (
    <RootContainer>
      <Button
        onPress={() => {}}
        variant={'blackOnDark'}
        size="small"
        text={t('offer.filterOffers')}
        afterIcon={downArrow}
      />
      <RightGroup>
        <Button
          onPress={() => {}}
          variant={'primary'}
          size={'small'}
          text={t('offer.myOffers')}
        />
        <ButtonSpacer />
        <Button
          onPress={() => {}}
          variant={'primary'}
          size={'small'}
          afterIcon={addIconSvg}
        />
      </RightGroup>
    </RootContainer>
  )
}

export default OffersListButtons

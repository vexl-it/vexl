import styled from '@emotion/native'
import Image from '../../Image'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import addSvg from '../image/addSvg'

const RootContainer = styled.View``
const TextStyled = styled.Text``
const ImageStyled = styled(Image)``

function AddCustomContactCell({
  numberToAdd,
}: {
  numberToAdd: string
}): JSX.Element {
  const {t} = useTranslation()
  return (
    <RootContainer>
      <ImageStyled source={addSvg} />
      <TextStyled>{t('contactsList.addContact', {numberToAdd})}</TextStyled>
    </RootContainer>
  )
}

export default AddCustomContactCell

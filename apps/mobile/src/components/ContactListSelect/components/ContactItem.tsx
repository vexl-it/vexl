import styled from '@emotion/native'
import Text from '../../Text'
import Checkbox from '../../Checkbox'
import {
  useIsContactSelected,
  useToggleContactSelection,
} from '../state/selectedContacts'
import Image from '../../Image'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import picturePlaceholderSvg from '../image/picturePlaceholderSvg'

const RootContainer = styled.View`
  flex-direction: row;
  align-items: center;
`

const Placeholder = styled(Image)`
  width: 50px;
  height: 50px;
`

const ImageStyled = styled(Image)`
  width: 50px;
  height: 50px;
  border-radius: 12px;
`

const Name = styled(Text)`
  font-size: 18px;
  margin-bottom: 5px;
`
const Number = styled(Text)`
  font-size: 14px;
`

const InfoContainer = styled.View`
  flex: 1;
  margin-left: 16px;
  justify-content: space-between;
`

const CheckboxStyled = styled(Checkbox)``

interface Props {
  imageUri?: UriString
  numberToDisplay: string
  normalizedNumber: E164PhoneNumber
  name: string
}

function ContactItem({
  imageUri,
  numberToDisplay,
  normalizedNumber,
  name,
}: Props): JSX.Element {
  const isSelected = useIsContactSelected(normalizedNumber)
  const toggleContactSelection = useToggleContactSelection()

  return (
    <RootContainer>
      {imageUri ? (
        <ImageStyled resizeMode={'cover'} source={{uri: imageUri}} />
      ) : (
        <Placeholder source={picturePlaceholderSvg} />
      )}
      <InfoContainer>
        <Name fontWeight={500}>{name}</Name>
        <Number fontWeight={600} colorStyle="grayOnBlack">
          {numberToDisplay}
        </Number>
      </InfoContainer>
      <CheckboxStyled
        value={isSelected}
        onChange={(v) => {
          toggleContactSelection(v, normalizedNumber)
        }}
      />
    </RootContainer>
  )
}

export default ContactItem

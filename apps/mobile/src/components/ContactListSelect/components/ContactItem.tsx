import Checkbox from '../../Checkbox'
import {
  useIsContactSelected,
  useToggleContactSelection,
} from '../state/selectedContacts'
import SvgImage from '../../Image'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import picturePlaceholderSvg from '../image/picturePlaceholderSvg'
import {Image, Stack, Text} from 'tamagui'

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
    <Stack fd="row" ai="center">
      {imageUri ? (
        <Image
          width={50}
          height={50}
          br="$5"
          resizeMode={'cover'}
          src={{uri: imageUri}}
        />
      ) : (
        <SvgImage width={50} height={50} source={picturePlaceholderSvg} />
      )}
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff="$bodyFont500" fs={18} mb="$1">
          {name}
        </Text>
        <Text ff="$bodyFont600" col="$grayOnBlack" fos={14}>
          {numberToDisplay}
        </Text>
      </Stack>
      <Checkbox
        value={isSelected}
        onChange={(v) => {
          toggleContactSelection(v, normalizedNumber)
        }}
      />
    </Stack>
  )
}

export default ContactItem

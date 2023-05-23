import SvgImage from '../../Image'
import picturePlaceholderSvg from '../image/picturePlaceholderSvg'
import {Image, Stack, Text} from 'tamagui'
import {type Atom, useAtomValue} from 'jotai'
import {type ContactNormalized} from '../../../state/contacts/domain'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  contactAtom: Atom<ContactNormalized>
}

function ContactItem({contactAtom}: Props): JSX.Element {
  const {imageUri, numberToDisplay, name} = useAtomValue(contactAtom)

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
      <IsSelectedCheckbox contactAtom={contactAtom} />
    </Stack>
  )
}

export default ContactItem

import {useAtomValue, type Atom} from 'jotai'
import {Image, Stack, Text, XStack} from 'tamagui'
import {type ContactNormalized} from '../../../state/contacts/domain'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'
import IsNewIndicator from './IsNewIndicator'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  contactAtom: Atom<ContactNormalized>
}

function ContactItem({contactAtom}: Props): JSX.Element {
  const contact = useAtomValue(contactAtom)
  const {imageUri, normalizedNumber, name} = contact

  return (
    <XStack ai="center">
      <Stack>
        <IsNewIndicator contactAtom={contactAtom} />
        {imageUri ? (
          <Image
            width={50}
            height={50}
            br="$5"
            resizeMode="cover"
            source={{uri: imageUri}}
          />
        ) : (
          <SvgImage width={50} height={50} source={picturePlaceholderSvg} />
        )}
      </Stack>
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff="$body500" fs={18} mb="$1" color="$black">
          {name}
        </Text>
        <Text ff="$body600" col="$greyOnBlack" fos={14}>
          {normalizedNumber}
        </Text>
      </Stack>
      <IsSelectedCheckbox contactAtom={contactAtom} />
    </XStack>
  )
}

export default ContactItem

import {useAtomValue, type Atom} from 'jotai'
import {Image, Stack, Text, XStack, getTokens} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import SvgImage from '../../../../Image'
import picturePlaceholderSvg from '../../../../images/picturePlaceholderSvg'
import IsNewIndicator from './IsNewIndicator'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): JSX.Element {
  const contact = useAtomValue(contactAtom)
  const {
    info: {imageUri, name},
    computedValues: {normalizedNumber},
  } = contact

  return (
    <XStack testID="@contactItem" ai="center">
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
          <SvgImage
            width={50}
            height={50}
            source={picturePlaceholderSvg}
            fill={getTokens().color.grey.val}
          />
        )}
      </Stack>
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff="$body500" fs={18} mb="$1" color="$black">
          {name}
        </Text>
        <Text
          testID="@contactItem/normalizedNumber"
          ff="$body600"
          col="$greyOnBlack"
          fos={14}
        >
          {normalizedNumber}
        </Text>
      </Stack>
      <IsSelectedCheckbox contactAtom={contactAtom} />
    </XStack>
  )
}

export default ContactItem

import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {Image, Stack, Text, XStack, getTokens} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import IconButton from '../../../../IconButton'
import SvgImage from '../../../../Image'
import editIconSvg from '../../../../images/editIconSvg'
import picturePlaceholderSvg from '../../../../images/picturePlaceholderSvg'
import {contactSelectMolecule} from '../atom'
import IsNewIndicator from './IsNewIndicator'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): JSX.Element {
  const {editContactActionAtom} = useMolecule(contactSelectMolecule)
  const contact = useAtomValue(contactAtom)
  const editContact = useSetAtom(editContactActionAtom)
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
      <XStack space="$2">
        <IconButton
          variant="primary"
          height={32}
          width={32}
          icon={editIconSvg}
          onPress={() => {
            void editContact({contact})
          }}
        />
        <IsSelectedCheckbox contactAtom={contactAtom} />
      </XStack>
    </XStack>
  )
}

export default ContactItem

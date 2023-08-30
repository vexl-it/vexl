import SvgImage from '../../Image'
import {Image, Stack, Text, XStack} from 'tamagui'
import {type Atom, useAtomValue} from 'jotai'
import {type ContactNormalized} from '../../../state/contacts/domain'
import IsSelectedCheckbox from './IsSelectedCheckbox'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'
import newlyAddedContactsToPhoneContactListAtom from '../../../state/contacts/atom/newlyAddedContactsToPhoneContactListAtom'

interface Props {
  contactAtom: Atom<ContactNormalized>
}

function ContactItem({contactAtom}: Props): JSX.Element {
  const newlyAddedContactsToPhoneContactList = useAtomValue(
    newlyAddedContactsToPhoneContactListAtom
  )
  const contact = useAtomValue(contactAtom)
  const {imageUri, normalizedNumber, name} = contact

  return (
    <XStack ai="center">
      <Stack>
        {newlyAddedContactsToPhoneContactList.includes(contact) && (
          <Stack
            pos={'absolute'}
            r={-7}
            t={-7}
            w={15}
            h={15}
            br={15}
            zi="$10"
            bc={'$main'}
          />
        )}
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
      </Stack>
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff={'$body500'} fs={18} mb={'$1'}>
          {name}
        </Text>
        <Text ff={'$body600'} col={'$greyOnBlack'} fos={14}>
          {normalizedNumber}
        </Text>
      </Stack>
      <IsSelectedCheckbox contactAtom={contactAtom} />
    </XStack>
  )
}

export default ContactItem

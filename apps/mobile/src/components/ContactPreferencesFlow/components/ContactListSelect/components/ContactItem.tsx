import {useNavigation} from '@react-navigation/native'
import {
  IconButton,
  PencilWriteEdit,
  Stack,
  Typography,
  UserImagePlaceholder,
  XStack,
  useTheme,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type ContactPreferencesStackScreenProps} from '../../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import ContactPictureImage from '../../../../ContactPictureImage'
import {contactSelectMolecule} from '../atom'
import IsSelectedSwitch from './IsSelectedSwitch'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): React.ReactElement {
  const contact = useAtomValue(contactAtom)
  const navigation =
    useNavigation<
      ContactPreferencesStackScreenProps<'ContactPreferencesList'>['navigation']
    >()
  const {selectContactAtom} = useMolecule(contactSelectMolecule)
  const theme = useTheme()
  const tokens = getTokens()
  const avatarSize = tokens.size.$9.val
  const {
    info: {nonUniqueContactId, name},
    computedValues: {normalizedNumber},
  } = contact
  const isSelected = useAtomValue(selectContactAtom(normalizedNumber))
  const contactTextColor = isSelected
    ? '$foregroundPrimary'
    : '$foregroundTertiary'
  const contactNumberColor = isSelected
    ? '$foregroundSecondary'
    : '$foregroundTertiary'

  return (
    <XStack testID="@contactItem" ai="center" gap="$3" py="$4" px="$2">
      <Stack
        width="$9"
        height="$9"
        borderRadius="$2.5"
        borderWidth="$0.5"
        borderColor="$backgroundSecondary"
        overflow="hidden"
      >
        <ContactPictureImage
          contactId={nonUniqueContactId}
          width={avatarSize}
          height={avatarSize}
          borderRadius="$2.5"
          objectFit="cover"
          grayscale={!isSelected}
          fallback={
            <UserImagePlaceholder
              size={avatarSize}
              borderRadius={0}
              grayscale={!isSelected}
            />
          }
        />
      </Stack>
      <Stack f={1} gap="$1" minWidth={0}>
        <Typography
          variant="descriptionBold"
          color={contactTextColor}
          numberOfLines={1}
        >
          {name}
        </Typography>
        <Typography
          testID="@contactItem/normalizedNumber"
          variant="micro"
          color={contactNumberColor}
          numberOfLines={1}
        >
          {getInternationalPhoneNumber(normalizedNumber)}
        </Typography>
      </Stack>
      <XStack gap="$2" ai="center">
        <IconButton
          testID="@contactItem/edit"
          backgroundColor="$backgroundTertiary"
          onPress={() => {
            navigation.navigate('AddNewContact', {
              editContactNumber: normalizedNumber,
            })
          }}
        >
          <PencilWriteEdit size={24} color={theme.foregroundPrimary.get()} />
        </IconButton>
        <IsSelectedSwitch contactNumber={normalizedNumber} />
      </XStack>
    </XStack>
  )
}

export default React.memo(ContactItem)

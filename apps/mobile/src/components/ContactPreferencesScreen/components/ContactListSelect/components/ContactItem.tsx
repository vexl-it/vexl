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
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import ContactPictureImage from '../../../../ContactPictureImage'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): React.ReactElement {
  const contact = useAtomValue(contactAtom)
  const navigation =
    useNavigation<RootStackScreenProps<'ContactPreferences'>['navigation']>()
  const theme = useTheme()
  const avatarSize = getTokens().size.$9.val
  const {
    info: {nonUniqueContactId, name},
    computedValues: {normalizedNumber},
  } = contact

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
          fallback={<UserImagePlaceholder size={avatarSize} />}
        />
      </Stack>
      <Stack f={1} gap="$1" minWidth={0}>
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          numberOfLines={1}
        >
          {name}
        </Typography>
        <Typography
          testID="@contactItem/normalizedNumber"
          variant="micro"
          color="$foregroundSecondary"
          numberOfLines={1}
        >
          {getInternationalPhoneNumber(normalizedNumber)}
        </Typography>
      </Stack>
      <XStack gap="$2">
        <IconButton
          testID="@contactItem/edit"
          backgroundColor="$backgroundTertiary"
          onPress={() => {
            navigation.navigate('AddNewContact', {
              editContactNumber: normalizedNumber,
            })
          }}
        >
          <PencilWriteEdit size={30} color={theme.foregroundPrimary.get()} />
        </IconButton>
        <IsSelectedCheckbox contactNumber={normalizedNumber} />
      </XStack>
    </XStack>
  )
}

export default React.memo(ContactItem)

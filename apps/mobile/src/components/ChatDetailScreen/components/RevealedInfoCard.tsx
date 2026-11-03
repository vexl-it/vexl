import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  AddUserPersonContact,
  ArrowsHorizontal,
  Avatar,
  Button,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option, Schema} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity, type ImageSourcePropType} from 'react-native'
import {useTheme} from 'tamagui'
import {addContactWithUiFeedbackActionAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumberE} from '../../../state/contacts/utils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {reportErrorE} from '../../../utils/reportError'
import {ProfileImageAvatar} from '../../ProfileImageAvatar'

interface SideInfo {
  image:
    | RealLifeInfo['image']
    | {type: 'imageAsset'; source: ImageSourcePropType}
  name: string
  phoneNumber?: string
  onAvatarPress?: () => void
}

function RevealedInfoCardSide({
  image,
  name,
  phoneNumber,
  onAvatarPress,
}: SideInfo): React.JSX.Element {
  return (
    <YStack alignItems="center" flex={1} gap="$2">
      {image.type === 'imageAsset' ? (
        <Avatar size="$13" source={image.source} />
      ) : (
        <TouchableOpacity disabled={!onAvatarPress} onPress={onAvatarPress}>
          <ProfileImageAvatar image={image} size="$13" />
        </TouchableOpacity>
      )}
      <YStack alignItems="center" gap="$1">
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="paragraphSmall"
        >
          {name}
        </Typography>
        {phoneNumber ? (
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="micro"
          >
            {phoneNumber}
          </Typography>
        ) : null}
      </YStack>
    </YStack>
  )
}

export function AddToContactsButton({
  fullPhoneNumber,
  userImage,
  userName,
}: {
  fullPhoneNumber?: string
  userImage?: RealLifeInfo['image']
  userName: string
}): React.ReactElement | null {
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackActionAtom)
  const theme = useTheme()
  const {t} = useTranslation()
  const [contactAdded, setContactAdded] = React.useState(false)

  const handlePress = (): void => {
    if (!fullPhoneNumber) return

    void Effect.runPromise(
      Effect.gen(function* (_) {
        const normalizedNumber = yield* _(
          Schema.decodeUnknown(E164PhoneNumber)(fullPhoneNumber)
        )
        const hash = yield* _(hashPhoneNumberE(normalizedNumber))

        return yield* _(
          addRevealedContact({
            avatar: userImage,
            info: {
              name: userName,
              numberToDisplay: fullPhoneNumber,
              rawNumber: fullPhoneNumber,
              label: Option.none(),
              nonUniqueContactId: Option.none(),
            },
            computedValues: {
              hash,
              normalizedNumber,
            },
          })
        )
      }).pipe(
        Effect.tap((contactSuccessfullyImportedOrEdited) =>
          Effect.sync(() => {
            if (contactSuccessfullyImportedOrEdited) {
              setContactAdded(true)
            }
          })
        ),
        Effect.tapError((error) =>
          reportErrorE(
            'warn',
            new Error('Error while adding revealed contact from chat message'),
            {error}
          )
        ),
        Effect.ignore
      )
    )
  }

  if (!fullPhoneNumber) return null

  return (
    <Button
      icon={AddUserPersonContact}
      disabled={contactAdded}
      onPress={handlePress}
      size="small"
      variant="tertiary"
      width="100%"
    >
      {t('messages.addToContacts')}
    </Button>
  )
}

function RevealedInfoCard({
  title,
  description,
  leftSide,
  rightSide,
  fullPhoneNumber,
  contactName,
}: {
  title: string
  description?: string
  leftSide: SideInfo
  rightSide: SideInfo
  fullPhoneNumber?: string
  contactName: string
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack mx="$4" mt="$4">
      <YStack
        alignItems="center"
        backgroundColor="$backgroundSecondary"
        borderRadius="$6"
        gap="$5"
        padding="$5"
        width="100%"
      >
        <YStack alignItems="center" gap="$1">
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="micro"
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              color="$foregroundSecondary"
              textAlign="center"
              variant="paragraphSmall"
            >
              {description}
            </Typography>
          ) : null}
        </YStack>
        <XStack alignItems="center" gap="$4" width="100%">
          <RevealedInfoCardSide {...leftSide} />
          <ArrowsHorizontal color={theme.foregroundPrimary.get()} size={28} />
          <RevealedInfoCardSide {...rightSide} />
        </XStack>
        <AddToContactsButton
          fullPhoneNumber={fullPhoneNumber}
          userImage={
            rightSide.image.type === 'imageAsset' ? undefined : rightSide.image
          }
          userName={contactName}
        />
      </YStack>
    </YStack>
  )
}

export default RevealedInfoCard

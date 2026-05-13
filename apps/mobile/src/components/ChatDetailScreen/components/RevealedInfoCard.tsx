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
import {TouchableOpacity} from 'react-native'
import {SvgXml} from 'react-native-svg'
import {useTheme} from 'tamagui'
import {addContactWithUiFeedbackActionAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumberE} from '../../../state/contacts/utils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {reportErrorE} from '../../../utils/reportError'
import resolveLocalUri from '../../../utils/resolveLocalUri'

const revealAvatarSize = 80

function RevealedInfoCardAvatar({
  image,
  onPress,
}: {
  image: RealLifeInfo['image']
  onPress?: () => void
}): React.JSX.Element {
  const avatar =
    image.type === 'imageUri' ? (
      <Avatar
        customSize={revealAvatarSize}
        source={{uri: resolveLocalUri(image.imageUri)}}
      />
    ) : (
      <Avatar customSize={revealAvatarSize}>
        <SvgXml
          width={revealAvatarSize}
          height={revealAvatarSize}
          xml={image.svgXml.xml}
        />
      </Avatar>
    )

  return onPress ? (
    <TouchableOpacity onPress={onPress}>{avatar}</TouchableOpacity>
  ) : (
    avatar
  )
}

interface SideInfo {
  image: RealLifeInfo['image'] | {type: 'imageAsset'; source: any}
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
        <Avatar customSize={revealAvatarSize} source={image.source} />
      ) : (
        <RevealedInfoCardAvatar image={image} onPress={onAvatarPress} />
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

function AddToContactsButton({
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
  leftSide,
  rightSide,
  fullPhoneNumber,
  contactName,
}: {
  title: string
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
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="micro"
        >
          {title}
        </Typography>
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

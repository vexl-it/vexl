import {
  Avatar,
  Button,
  InfoBox,
  NavigationBar,
  resolveSizePx,
  Screen,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {atom, useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {useWindowDimensions} from 'react-native'
import {SvgXml} from 'react-native-svg'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../state/session/userDataAtoms'
import {createImportContactLink} from '../../utils/deepLinks/createLinks'
import {useTranslation} from '../../utils/localization/I18nProvider'
import resolveLocalUri from '../../utils/resolveLocalUri'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {SharableQrCode} from '../SharableQrCode'

const encodedUserDetailsUriAtom = atom<string>((get) => {
  const userData = get(userDataRealOrAnonymizedAtom)
  const phoneNumber = get(userPhoneNumberAtom)

  return createImportContactLink({
    phoneNumber,
    userData,
  })
})

function ProfileCard(): React.ReactElement {
  const userData = useAtomValue(userDataRealOrAnonymizedAtom)
  const userPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const displayName = userData.userName
  const profileImage = userData.image
  const formattedPhoneNumber = useMemo(
    () =>
      parsePhoneNumber(userPhoneNumber).number?.international ??
      userPhoneNumber,
    [userPhoneNumber]
  )

  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      gap="$3"
      padding="$4"
    >
      {profileImage.type === 'svgXml' ? (
        <Avatar size="$9">
          <SvgXml
            width={resolveSizePx('$9')}
            height={resolveSizePx('$9')}
            xml={profileImage.svgXml.xml}
          />
        </Avatar>
      ) : (
        <Avatar
          size="$9"
          source={{uri: resolveLocalUri(profileImage.imageUri)}}
        />
      )}
      <YStack flex={1} minWidth={0} gap="$2">
        <Typography
          variant="paragraphSmallBold"
          color="$foregroundPrimary"
          numberOfLines={1}
        >
          {displayName}
        </Typography>
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          numberOfLines={1}
        >
          {formattedPhoneNumber}
        </Typography>
      </YStack>
    </XStack>
  )
}

function ShareProfileScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const theme = useTheme()
  const {width} = useWindowDimensions()
  const encodedUserDetailsUri = useAtomValue(encodedUserDetailsUriAtom)
  const qrCodeSize = Math.min(width - 96, 360)

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title="Share profile"
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
      footer={
        <YStack
          gap="$3"
          backgroundColor="$backgroundPrimary"
          paddingBottom="$3"
        >
          <InfoBox variant="pink">
            Sharing your QR code also shares your phone number. Be picky who you
            share it with.
          </InfoBox>
          <Button onPress={safeGoBack}>{t('common.close')}</Button>
        </YStack>
      }
    >
      <YStack flex={1} gap="$4">
        <ProfileCard />
        <Stack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          justifyContent="center"
          padding="$8"
        >
          <SharableQrCode
            backgroundColor={theme.backgroundSecondary.get()}
            color={theme.foregroundPrimary.get()}
            size={qrCodeSize}
            value={encodedUserDetailsUri}
          />
        </Stack>
      </YStack>
    </Screen>
  )
}

export default ShareProfileScreen

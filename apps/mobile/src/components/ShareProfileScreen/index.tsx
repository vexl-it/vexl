import {
  Button,
  getTokens,
  InfoBox,
  NavigationBar,
  PersonRow,
  Screen,
  Stack,
  useTheme,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {atom, useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {useWindowDimensions} from 'react-native'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../state/session/userDataAtoms'
import {createImportContactLink} from '../../utils/deepLinks/createLinks'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {ProfileImageAvatar} from '../ProfileImageAvatar'
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
  const formattedPhoneNumber = useMemo(
    () =>
      parsePhoneNumber(userPhoneNumber).number?.international ??
      userPhoneNumber,
    [userPhoneNumber]
  )

  return (
    <PersonRow
      size="large"
      background="secondary"
      avatar={<ProfileImageAvatar image={userData.image} size="$9" />}
      title={userData.userName}
      subtitle={formattedPhoneNumber}
    />
  )
}

function ShareProfileScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const theme = useTheme()
  const {width} = useWindowDimensions()
  const encodedUserDetailsUri = useAtomValue(encodedUserDetailsUriAtom)
  const {space} = getTokens()
  const qrCodeFrameInset = 2 * (space.$5.val + space.$8.val)
  const qrCodeSize = Math.min(width - qrCodeFrameInset, 360)

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

import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
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
import {useAtomValue} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {SvgXml} from 'react-native-svg'
import {userDataRealOrAnonymizedAtom} from '../../state/session/userDataAtoms'
import {createImportContactLink} from '../../utils/deepLinks/createLinks'
import {getInternationalPhoneNumber} from '../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../utils/localization/I18nProvider'
import resolveLocalUri from '../../utils/resolveLocalUri'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {ChangePhoneNumber, usePickedPhoneNumber} from '../PhoneNumberPicker'
import {SharableQrCode} from '../SharableQrCode'

function ProfileCard({
  phoneNumbers,
  phoneNumber,
  onPhoneNumberPick,
}: {
  readonly phoneNumbers: readonly E164PhoneNumber[]
  readonly phoneNumber: E164PhoneNumber
  readonly onPhoneNumberPick: (phoneNumber: E164PhoneNumber) => void
}): React.ReactElement {
  const userData = useAtomValue(userDataRealOrAnonymizedAtom)
  const displayName = userData.userName
  const profileImage = userData.image

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      padding="$4"
    >
      <ChangePhoneNumber
        phoneNumbers={phoneNumbers}
        value={phoneNumber}
        onValueChange={onPhoneNumberPick}
      >
        {(changeButton) => (
          <XStack alignItems="center" gap="$3">
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
                {getInternationalPhoneNumber(phoneNumber)}
              </Typography>
            </YStack>
            {changeButton}
          </XStack>
        )}
      </ChangePhoneNumber>
    </YStack>
  )
}

function ShareProfileScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const theme = useTheme()
  const {width} = useWindowDimensions()
  const userData = useAtomValue(userDataRealOrAnonymizedAtom)
  const {phoneNumbers, phoneNumber, pickPhoneNumber} = usePickedPhoneNumber()
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
        <ProfileCard
          phoneNumbers={phoneNumbers}
          phoneNumber={phoneNumber}
          onPhoneNumberPick={pickPhoneNumber}
        />
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
            value={createImportContactLink({phoneNumber, userData})}
          />
        </Stack>
      </YStack>
    </Screen>
  )
}

export default ShareProfileScreen

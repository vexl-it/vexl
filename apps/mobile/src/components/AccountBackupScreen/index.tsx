import {
  AccountBackupGraphic,
  Button,
  ChevronLeft,
  InfoBox,
  InfoPoint,
  Lock,
  NavigationBar,
  QuestionmarkCircle,
  RefreshArrowsRectangle,
  Screen,
  ScreenHeading,
  Stack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {getInternationalPhoneNumber} from '../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {PhoneNumberPicker, usePickedPhoneNumber} from '../PhoneNumberPicker'

type Props = RootStackScreenProps<'AccountBackup'>

export default function AccountBackupScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const {phoneNumbers, phoneNumber, pickPhoneNumber} = usePickedPhoneNumber()

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('accountBackup.title')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
      footer={
        <Button
          onPress={() => {
            navigation.navigate('AccountBackupPin', {phoneNumber})
          }}
        >
          {t('accountBackup.createButton')}
        </Button>
      }
    >
      <YStack gap="$7" paddingBottom="$5">
        <Stack alignItems="center">
          <AccountBackupGraphic animate height={171} width={147} />
        </Stack>
        <ScreenHeading
          title={t('accountBackup.heading')}
          text={t('accountBackup.description')}
        />
        <PhoneNumberPicker
          phoneNumbers={phoneNumbers}
          value={phoneNumber}
          onValueChange={pickPhoneNumber}
          title={t('accountBackup.phoneNumber.title')}
          text={t('accountBackup.phoneNumber.text')}
        />
        <InfoBox variant="pink">
          {t('accountBackup.warning', {
            phoneNumber: getInternationalPhoneNumber(phoneNumber),
          })}
        </InfoBox>
        <YStack gap="$4">
          <InfoPoint icon={Lock}>{t('accountBackup.storeSafely')}</InfoPoint>
          <InfoPoint icon={QuestionmarkCircle}>
            {t('accountBackup.forgotPin')}
          </InfoPoint>
          <InfoPoint icon={RefreshArrowsRectangle}>
            {t('accountBackup.onlyOnce')}
          </InfoPoint>
        </YStack>
      </YStack>
    </Screen>
  )
}

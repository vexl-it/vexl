import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  ScreenHeading,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {PhoneNumberRadioGroup, usePickedPhoneNumber} from '../PhoneNumberPicker'

type Props = RootStackScreenProps<'AccountBackupPhoneNumber'>

export default function AccountBackupPhoneNumberScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {phoneNumbers, phoneNumber, pickPhoneNumber} = usePickedPhoneNumber()

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          leftAction={{icon: ChevronLeft, onPress: navigation.goBack}}
        />
      }
      footer={
        <Button
          onPress={() => {
            navigation.navigate('AccountBackupPin', {phoneNumber})
          }}
        >
          {t('common.continue')}
        </Button>
      }
    >
      <YStack flex={1} justifyContent="center" gap="$7" paddingVertical="$5">
        <ScreenHeading
          title={t('accountBackup.phoneNumber.title')}
          text={t('accountBackup.phoneNumber.text')}
        />
        <PhoneNumberRadioGroup
          phoneNumbers={phoneNumbers}
          value={phoneNumber}
          onValueChange={pickPhoneNumber}
        />
      </YStack>
    </Screen>
  )
}

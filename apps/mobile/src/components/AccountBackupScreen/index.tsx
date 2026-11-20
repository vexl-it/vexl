import {
  AccountBackupGraphic,
  Button,
  ChevronLeft,
  InfoList,
  InfoListItem,
  NavigationBar,
  Screen,
  ScreenHeading,
  Stack,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {userPhoneNumbersAtom} from '../../state/session/userDataAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'AccountBackup'>

export default function AccountBackupScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const phoneNumbers = useAtomValue(userPhoneNumbersAtom)

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
            if (phoneNumbers.length > 1)
              navigation.navigate('AccountBackupPhoneNumber')
            else
              navigation.navigate('AccountBackupPin', {
                phoneNumber: phoneNumbers[0],
              })
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
        <InfoList>
          <InfoListItem
            title={t('accountBackup.whatYouNeed.title')}
            note={t('accountBackup.whatYouNeed.text')}
          />
          <InfoListItem
            title={t('accountBackup.storeSafely.title')}
            note={t('accountBackup.storeSafely.text')}
          />
          <InfoListItem
            title={t('accountBackup.forgotPin.title')}
            note={t('accountBackup.forgotPin.text')}
          />
          <InfoListItem
            title={t('accountBackup.onlyOnce.title')}
            note={t('accountBackup.onlyOnce.text')}
          />
        </InfoList>
      </YStack>
    </Screen>
  )
}

import {
  Button,
  ChevronLeft,
  ContactsGraphic,
  InfoList,
  InfoListItem,
  NavigationBar,
  Screen,
  ScreenHeading,
  Stack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type EditProfileStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'

function AddPhoneNumberIntroScreen({
  navigation,
}: EditProfileStackScreenProps<'AddPhoneNumberIntro'>): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.phoneNumbers.add')}
          leftAction={{icon: ChevronLeft, onPress: goBack}}
        />
      }
      footer={
        <Button
          variant="primary"
          size="large"
          onPress={() => {
            navigation.navigate('AddPhoneNumber')
          }}
        >
          {t('common.continue')}
        </Button>
      }
    >
      <YStack gap="$7" paddingBottom="$5">
        <Stack alignItems="center">
          <ContactsGraphic animate height={171} width={147} />
        </Stack>
        <ScreenHeading
          title={t('editProfileScreen.addPhoneNumberIntro.title')}
          text={t('editProfileScreen.addPhoneNumberIntro.text')}
        />
        <InfoList>
          <InfoListItem
            title={t(
              'editProfileScreen.addPhoneNumberIntro.linkedNumbers.title'
            )}
            note={t('editProfileScreen.addPhoneNumberIntro.linkedNumbers.text')}
          />
          <InfoListItem
            title={t('editProfileScreen.addPhoneNumberIntro.contacts.title')}
            note={t('editProfileScreen.addPhoneNumberIntro.contacts.text')}
          />
          <InfoListItem
            title={t('editProfileScreen.addPhoneNumberIntro.privacy.title')}
            note={t('editProfileScreen.addPhoneNumberIntro.privacy.text')}
          />
        </InfoList>
      </YStack>
    </Screen>
  )
}

export default AddPhoneNumberIntroScreen

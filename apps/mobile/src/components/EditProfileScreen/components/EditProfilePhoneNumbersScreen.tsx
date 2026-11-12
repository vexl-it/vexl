import {
  Button,
  CellPhoneMobileDevice,
  ChevronLeft,
  IconButton,
  NavigationBar,
  Screen,
  TextTag,
  TrashBin,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useTheme} from 'tamagui'
import {type EditProfileStackScreenProps} from '../../../navigationTypes'
import {userPhoneNumbersAtom} from '../../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {removePhoneNumberWithUiFeedbackActionAtom} from '../phoneNumbersUiActionAtoms'

function EditProfilePhoneNumbersScreen({
  navigation,
}: EditProfileStackScreenProps<'EditProfilePhoneNumbers'>): React.ReactElement {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()
  const theme = useTheme()
  const phoneNumbers = useAtomValue(userPhoneNumbersAtom)
  const removePhoneNumber = useSetAtom(
    removePhoneNumberWithUiFeedbackActionAtom
  )
  const canRemove = phoneNumbers.length > 1

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.phoneNumbers.title')}
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
          {t('editProfileScreen.phoneNumbers.add')}
        </Button>
      }
    >
      <YStack gap="$5" paddingTop="$4">
        <Typography variant="description" color="$foregroundSecondary">
          {t('editProfileScreen.phoneNumbers.description')}
        </Typography>
        <YStack gap="$3">
          {pipe(
            phoneNumbers,
            Array.map((phoneNumber, index) => (
              <XStack
                key={phoneNumber}
                alignItems="center"
                gap="$3"
                padding="$5"
                backgroundColor="$backgroundSecondary"
                borderRadius="$5"
              >
                <CellPhoneMobileDevice
                  size={24}
                  color={theme.foregroundSecondary.get()}
                />
                <Typography
                  variant="descriptionBold"
                  color="$foregroundPrimary"
                  flexShrink={1}
                >
                  {getInternationalPhoneNumber(phoneNumber)}
                </Typography>
                {index === 0 ? (
                  <TextTag
                    variant="neutral"
                    label={t('editProfileScreen.phoneNumbers.main')}
                  />
                ) : null}
                <XStack flex={1} />
                {canRemove ? (
                  <IconButton
                    aria-label={t(
                      'editProfileScreen.phoneNumbers.remove.button'
                    )}
                    backgroundColor="$backgroundTertiary"
                    onPress={() => {
                      void Effect.runPromise(removePhoneNumber(phoneNumber))
                    }}
                  >
                    <TrashBin size={24} color={theme.foregroundPrimary.get()} />
                  </IconButton>
                ) : null}
              </XStack>
            ))
          )}
        </YStack>
      </YStack>
    </Screen>
  )
}

export default EditProfilePhoneNumbersScreen

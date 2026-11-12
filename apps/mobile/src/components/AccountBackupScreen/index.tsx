import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  AccountBackupGraphic,
  Button,
  ChevronLeft,
  InfoBox,
  InfoPoint,
  Lock,
  NavigationBar,
  QuestionmarkCircle,
  RadioGroup,
  RefreshArrowsRectangle,
  RowRadiobutton,
  Screen,
  ScreenHeading,
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {userPhoneNumbersAtom} from '../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'AccountBackup'>

export default function AccountBackupScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const phoneNumbers = useAtomValue(userPhoneNumbersAtom)
  const [chosenPhoneNumber, setChosenPhoneNumber] = useState<E164PhoneNumber>()
  // Falls back to the main number, also when the chosen one was removed meanwhile.
  const phoneNumber = pipe(
    phoneNumbers,
    Array.findFirst((one) => one === chosenPhoneNumber),
    Option.getOrElse(() => Array.headNonEmpty(phoneNumbers))
  )

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
        {phoneNumbers.length > 1 ? (
          <YStack gap="$3">
            <Typography variant="paragraphDemibold" color="$foregroundPrimary">
              {t('accountBackup.phoneNumber.title')}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              {t('accountBackup.phoneNumber.text')}
            </Typography>
            <RadioGroup
              allowedValues={phoneNumbers}
              value={phoneNumber}
              onValueChange={setChosenPhoneNumber}
            >
              <YStack gap="$3">
                {pipe(
                  phoneNumbers,
                  Array.map((one) => (
                    <RowRadiobutton
                      key={one}
                      value={one}
                      label={getInternationalPhoneNumber(one)}
                    />
                  ))
                )}
              </YStack>
            </RadioGroup>
          </YStack>
        ) : null}
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

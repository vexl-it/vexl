import {
  FaqStayAnonymous,
  Stack,
  Typography,
  VexlTextGraphic,
  YStack,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import clearMmkvStorageAndEmptyAtoms from '../../../utils/clearMmkvStorageAndEmptyAtoms'
import {verifyFreshInstallForMigration} from '../../../utils/deviceMigration/snapshot/freshInstallCheck'
import {handleCameraPermissionsActionAtom} from '../../../utils/handleCameraPermissions'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showTosSummaryForAlreadyLoggedInUserAtom} from '../../../utils/preferences'
import {enterDestinationMigrationUi} from '../../DeviceMigrationRoot/coordinator'
import LoginFlowScreen, {
  LoginFlowCentered,
  LoginFlowText,
  LoginFlowTitle,
} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'Intro1'>

export default function Intro1Screen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const faqGraphicScale = Math.min(1, availableWidth / 330)
  const setShowTosSummaryForAlreadyLoggedInUser = useSetAtom(
    showTosSummaryForAlreadyLoggedInUserAtom
  )
  const handleCameraPermissions = useSetAtom(handleCameraPermissionsActionAtom)
  const [migrationEntryBlocked, setMigrationEntryBlocked] = useState(false)

  useEffect(() => {
    setShowTosSummaryForAlreadyLoggedInUser(false)
  }, [setShowTosSummaryForAlreadyLoggedInUser])

  return (
    <LoginFlowScreen
      action={{
        label: t('loginFlow.v2.intro1.action'),
        onPress: () => {
          clearMmkvStorageAndEmptyAtoms()
          navigation.navigate('Intro2')
        },
      }}
      footer={
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="paragraphSmall"
        >
          {t('loginFlow.v2.intro1.termsPrefix')}{' '}
          <Typography
            color="$accentYellowPrimary"
            onPress={() => {
              navigation.navigate('TermsAndConditions')
            }}
            textDecorationLine="underline"
            variant="paragraphSmall"
          >
            {t('loginFlow.start.termsOfUse')}
          </Typography>
          .
        </Typography>
      }
      header={
        <Stack alignItems="center" mt="$5">
          <VexlTextGraphic animate height={27} />
        </Stack>
      }
    >
      <LoginFlowCentered>
        <YStack alignItems="center" gap="$9" width="100%">
          <FaqStayAnonymous
            animate
            height={236 * faqGraphicScale}
            width={330 * faqGraphicScale}
          />
          <YStack gap="$4" width="100%">
            <LoginFlowTitle>{t('loginFlow.v2.intro1.title')}</LoginFlowTitle>
            <LoginFlowText>{t('loginFlow.v2.intro1.text')}</LoginFlowText>
            {migrationEntryBlocked ? (
              <Typography
                variant="paragraphSmall"
                color="$redForeground"
                textAlign="center"
              >
                {t('deviceMigration.destination.freshBlockedBody')}
              </Typography>
            ) : null}
            <Typography
              testID="move-account-from-another-device"
              variant="paragraph"
              color="$accentYellowPrimary"
              textAlign="center"
              textDecorationLine="underline"
              onPress={() => {
                void Effect.runPromise(verifyFreshInstallForMigration())
                  .then(
                    async () =>
                      await Effect.runPromise(handleCameraPermissions())
                  )
                  .then((permission) => {
                    if (permission === 'granted') enterDestinationMigrationUi()
                    else setMigrationEntryBlocked(true)
                  })
                  .catch(() => {
                    setMigrationEntryBlocked(true)
                  })
              }}
            >
              {t('deviceMigration.destination.entryLabel')}
            </Typography>
          </YStack>
        </YStack>
      </LoginFlowCentered>
    </LoginFlowScreen>
  )
}

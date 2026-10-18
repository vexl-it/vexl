import {usePreventRemove} from '@react-navigation/native'
import {Button, Loader, Screen, Typography, YStack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  restoreFromBackupStateAtom,
  type RestoreFailure,
} from '../../../state/backup/restoreFromBackup'
import {
  useTranslation,
  type TFunction,
} from '../../../utils/localization/I18nProvider'

type Props = LoginFlowStackScreenProps<'RestoreFromBackup'>

function Title({children}: {readonly children: string}): React.ReactElement {
  return (
    <Typography color="$foregroundPrimary" variant="heading3">
      {children}
    </Typography>
  )
}

function Text({children}: {readonly children: string}): React.ReactElement {
  return (
    <Typography color="$foregroundSecondary" variant="paragraphSmall">
      {children}
    </Typography>
  )
}

function RestoringContent(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Screen navigationBar={null}>
      <YStack alignItems="center" flex={1} gap="$5" justifyContent="center">
        <Loader size="large" />
        <YStack alignItems="center" gap="$3">
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="heading3"
          >
            {t('loginFlow.restoreFromBackup.restoring.title')}
          </Typography>
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {t('loginFlow.restoreFromBackup.restoring.text')}
          </Typography>
        </YStack>
      </YStack>
    </Screen>
  )
}

function failureText(failure: RestoreFailure, t: TFunction): string {
  if (failure === 'notABackup' || failure === 'unsupportedVersion')
    return t(`loginFlow.restoreFromBackup.errors.${failure}`)
  if (failure === 'offline') return t('common.NetworkError')
  return t('loginFlow.restoreFromBackup.failed.unknown')
}

function FailedContent({
  failure,
  onBackToLogin,
}: {
  readonly failure: RestoreFailure
  readonly onBackToLogin: () => void
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Screen
      navigationBar={null}
      footer={
        <Button onPress={onBackToLogin}>
          {t('loginFlow.restoreFromBackup.failed.backToLogin')}
        </Button>
      }
    >
      <YStack gap="$3" paddingTop="$10">
        {failure === 'backupNoLongerValid' ? (
          <>
            <Title>
              {t('loginFlow.restoreFromBackup.failed.noLongerValid.title')}
            </Title>
            <Text>
              {t('loginFlow.restoreFromBackup.failed.noLongerValid.text')}
            </Text>
          </>
        ) : (
          <>
            <Title>{t('loginFlow.restoreFromBackup.failed.title')}</Title>
            <Text>{failureText(failure, t)}</Text>
          </>
        )}
      </YStack>
    </Screen>
  )
}

export default function RestoreFromBackupScreen({
  navigation,
}: Props): React.ReactElement {
  const restoreState = useAtomValue(restoreFromBackupStateAtom)

  // Leaving mid-restore would let a second restore race the first one.
  usePreventRemove(restoreState.state === 'restoring', () => {})

  if (restoreState.state === 'failed')
    return (
      <FailedContent
        failure={restoreState.failure}
        onBackToLogin={() => {
          navigation.navigate('PhoneNumber')
        }}
      />
    )

  return <RestoringContent />
}

import {usePreventRemove} from '@react-navigation/native'
import {Button, Loader, Screen, Typography, YStack} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  finishRestoreFromBackupActionAtom,
  restoreFromBackupStateAtom,
  type RestoreFailure,
} from '../../../state/backup/restoreFromBackup'
import {useTranslation} from '../../../utils/localization/I18nProvider'

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

function RestoredContent(): React.ReactElement {
  const {t} = useTranslation()
  const finishRestore = useSetAtom(finishRestoreFromBackupActionAtom)

  return (
    <Screen
      navigationBar={null}
      scrollable
      footer={<Button onPress={finishRestore}>{t('common.continue')}</Button>}
    >
      <YStack gap="$8" paddingTop="$10">
        <YStack gap="$3">
          <Title>{t('loginFlow.restoreFromBackup.restored.title')}</Title>
          <Text>{t('loginFlow.restoreFromBackup.restored.text')}</Text>
        </YStack>
        <YStack gap="$3">
          <Typography color="$foregroundPrimary" variant="paragraphSmallBold">
            {t('loginFlow.restoreFromBackup.restored.chatsTitle')}
          </Typography>
          <Text>{t('loginFlow.restoreFromBackup.restored.chatsText')}</Text>
          <Text>{t('loginFlow.restoreFromBackup.restored.lostChatsText')}</Text>
          <Text>{t('loginFlow.restoreFromBackup.restored.dividerText')}</Text>
        </YStack>
        <Text>{t('loginFlow.restoreFromBackup.restored.contactsText')}</Text>
      </YStack>
    </Screen>
  )
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
            <Text>
              {failure === 'offline'
                ? t('common.NetworkError')
                : t('loginFlow.restoreFromBackup.failed.unknown')}
            </Text>
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

  if (restoreState.state === 'restored') return <RestoredContent />

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

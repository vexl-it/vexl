import {Button, Screen, Typography, YStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {showRestoredAccountInfoAtom} from '../../../state/backup/restoreFromBackup'
import {useTranslation} from '../../../utils/localization/I18nProvider'

type Props = PostLoginFlowStackScreenProps<'RestoredAccountInfo'>

function Text({children}: {readonly children: string}): React.ReactElement {
  return (
    <Typography color="$foregroundSecondary" variant="paragraphSmall">
      {children}
    </Typography>
  )
}

export default function RestoredAccountInfoScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const setShowRestoredAccountInfo = useSetAtom(showRestoredAccountInfoAtom)

  return (
    <Screen
      navigationBar={null}
      scrollable
      footer={
        <Button
          onPress={() => {
            setShowRestoredAccountInfo(false)
            navigation.replace('ContactsImport')
          }}
        >
          {t('common.continue')}
        </Button>
      }
    >
      <YStack gap="$8" paddingTop="$10">
        <YStack gap="$3">
          <Typography color="$foregroundPrimary" variant="heading3">
            {t('loginFlow.restoreFromBackup.restored.title')}
          </Typography>
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

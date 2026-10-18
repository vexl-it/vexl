import {
  Button,
  ChatBubbles,
  InfoPoint,
  PeopleUsers,
  RestoredAccountGraphic,
  SandWatch,
  Screen,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {showRestoredAccountInfoAtom} from '../../../state/backup/restoreFromBackup'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {PostLoginFlowCopy} from './PostLoginFlowScreen'

type Props = PostLoginFlowStackScreenProps<'RestoredAccountInfo'>

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
      <YStack flex={1} justifyContent="center" gap="$8" paddingVertical="$5">
        <YStack alignItems="center" gap="$9">
          <RestoredAccountGraphic animate height={163} width={160} />
          <PostLoginFlowCopy
            title={t('loginFlow.restoreFromBackup.restored.title')}
            text={t('loginFlow.restoreFromBackup.restored.text')}
          />
        </YStack>
        <YStack gap="$4">
          <InfoPoint icon={SandWatch}>
            {t('loginFlow.restoreFromBackup.restored.chatsText')}
          </InfoPoint>
          <InfoPoint icon={ChatBubbles}>
            {t('loginFlow.restoreFromBackup.restored.dividerText')}
          </InfoPoint>
          <InfoPoint icon={PeopleUsers}>
            {t('loginFlow.restoreFromBackup.restored.contactsText')}
          </InfoPoint>
        </YStack>
      </YStack>
    </Screen>
  )
}

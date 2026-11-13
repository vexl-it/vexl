import {
  Button,
  InfoList,
  InfoListItem,
  RestoredAccountGraphic,
  Screen,
  ScreenHeading,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {showRestoredAccountInfoAtom} from '../../../state/backup/restoreFromBackup'
import {useTranslation} from '../../../utils/localization/I18nProvider'

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
          <ScreenHeading
            title={t('loginFlow.restoreFromBackup.restored.title')}
            text={t('loginFlow.restoreFromBackup.restored.text')}
          />
        </YStack>
        <InfoList>
          <InfoListItem
            title={t('loginFlow.restoreFromBackup.restored.chats.title')}
            note={t('loginFlow.restoreFromBackup.restored.chats.text')}
          />
          <InfoListItem
            title={t('loginFlow.restoreFromBackup.restored.contacts.title')}
            note={t('loginFlow.restoreFromBackup.restored.contacts.text')}
          />
        </InfoList>
      </YStack>
    </Screen>
  )
}

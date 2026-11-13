import {
  Button,
  ChatBubbles,
  InfoBox,
  InfoPoint,
  PeopleUsers,
  RestoredAccountGraphic,
  SandWatch,
  Screen,
  ScreenHeading,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtom} from 'jotai'
import React from 'react'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {restoredAccountInfoAtom} from '../../../state/backup/restoreFromBackup'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'

type Props = PostLoginFlowStackScreenProps<'RestoredAccountInfo'>

export default function RestoredAccountInfoScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [restoredAccountInfo, setRestoredAccountInfo] = useAtom(
    restoredAccountInfoAtom
  )
  const notRestoredPhoneNumbers = Option.match(restoredAccountInfo, {
    onNone: () => [],
    onSome: (info) => info.notRestoredPhoneNumbers,
  })

  return (
    <Screen
      navigationBar={null}
      scrollable
      footer={
        <Button
          onPress={() => {
            setRestoredAccountInfo(Option.none())
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
        {Array.isNonEmptyReadonlyArray(notRestoredPhoneNumbers) ? (
          <InfoBox variant="pink">
            {t('loginFlow.restoreFromBackup.restored.notRestoredPhoneNumbers', {
              count: notRestoredPhoneNumbers.length,
              phoneNumbers: pipe(
                notRestoredPhoneNumbers,
                Array.map(getInternationalPhoneNumber),
                Array.join(', ')
              ),
            })}
          </InfoBox>
        ) : null}
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

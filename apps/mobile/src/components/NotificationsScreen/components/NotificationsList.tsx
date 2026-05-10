import {Typography, YStack} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {NotificationsAtomsAtom} from '../state'
import {type NotificationCenterRecord} from '../state/domain'
import NotificationListCard from './NotificationListCard'

function renderNotificationItem({
  item,
}: {
  readonly item: Atom<NotificationCenterRecord>
}): React.ReactElement | null {
  return <NotificationListCard notificationAtom={item} />
}

function NotificationsList(): React.ReactElement {
  const {t} = useTranslation()
  const notificationAtoms = useAtomValue(NotificationsAtomsAtom)

  const listEmptyComponent = useCallback(
    () => (
      <YStack flex={1} py="$5" alignItems="center">
        <YStack maxWidth="350" gap="$4">
          <Typography
            variant="heading3"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('notificationsScreen.noNotifications.title')}
          </Typography>
          <Typography
            variant="paragraph"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t('notificationsScreen.noNotifications.description')}
          </Typography>
        </YStack>
      </YStack>
    ),
    [t]
  )

  return (
    <FlatList
      data={notificationAtoms}
      keyExtractor={atomKeyExtractor}
      renderItem={renderNotificationItem}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={listEmptyComponent}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 24,
        rowGap: 12,
      }}
    />
  )
}

export default NotificationsList

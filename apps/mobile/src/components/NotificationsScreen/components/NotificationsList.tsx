import {EmptyState} from '@vexl-next/ui'
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
      <EmptyState
        px="$5"
        title={t('notificationsScreen.noNotifications.title')}
        description={t('notificationsScreen.noNotifications.description')}
      />
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

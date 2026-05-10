import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Avatar, Button, NotificationCard, Stack, TextTag} from '@vexl-next/ui'
import dayjs from 'dayjs'
import {Match} from 'effect/index'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useRef} from 'react'
import {Linking} from 'react-native'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {cancelNotificationCenterRecordActionAtom} from '../state'
import {type NotificationCenterRecord} from '../state/domain'
import NotificationListCardRightSwipeActions from './NotificationListCardRightSwipeActions'
import VexlAvatar from './VexlAvatar'

function getClubDeactivationMessage({
  reason,
  clubName,
  t,
}: {
  readonly reason: 'EXPIRED' | 'FLAGGED' | 'OTHER'
  readonly clubName: string
  readonly t: ReturnType<typeof useTranslation>['t']
}): string {
  switch (reason) {
    case 'EXPIRED':
      return t('notifications.CLUB_DEACTIVATED.EXPIRED.body', {
        name: clubName,
      })
    case 'FLAGGED':
      return t('notifications.CLUB_DEACTIVATED.FLAGGED.body', {
        name: clubName,
      })
    case 'OTHER':
      return t('notifications.CLUB_DEACTIVATED.OTHER.body', {
        name: clubName,
      })
  }
}

function formatNotificationTime(date: UnixMilliseconds): string {
  if (dayjs(date).isSame(dayjs(), 'day')) return dayjs(date).format('HH:mm')

  return dayjs(date).format('LL')
}

function NotificationListCard({
  notificationAtom,
}: {
  readonly notificationAtom: Atom<NotificationCenterRecord>
}): React.ReactElement | null {
  const swipeableRef = useRef<SwipeableMethods>(null)
  const notification = useAtomValue(notificationAtom)
  const cancelNotificationCenterRecord = useSetAtom(
    cancelNotificationCenterRecordActionAtom
  )
  const {t} = useTranslation()

  if (notification.status.isCancelled) return null

  const cardData = Match.value(notification.data).pipe(
    Match.tag('VexlProductNotificationData', ({productNotification}) => {
      const actionLink = productNotification.actionLink

      return {
        name: 'Vexl',
        avatar: <VexlAvatar />,
        category:
          productNotification.type === 'MARKETING'
            ? t('notificationsScreen.important')
            : t('notificationsScreen.system'),
        message: `${productNotification.title} ${productNotification.description}`,
        action: actionLink
          ? () => {
              void Linking.openURL(actionLink)
            }
          : undefined,
        actionText: productNotification.actionText ?? t('common.learnMore'),
      }
    }),
    Match.tag('ClubAdmissionNotificationData', ({clubInfo}) => ({
      name: clubInfo.name,
      avatar: <Avatar source={{uri: clubInfo.clubImageUrl}} />,
      category: 'Club',
      message: t('notificationsScreen.addmitedToClub.text', {
        name: clubInfo.name,
      }),
      action: undefined,
      actionText: undefined,
    })),
    Match.tag('ClubDeactivationNotificationData', ({clubInfo, reason}) => ({
      name: clubInfo.name,
      avatar: <Avatar source={{uri: clubInfo.clubImageUrl}} />,
      category: 'Club',
      message: getClubDeactivationMessage({
        reason,
        clubName: clubInfo.name,
        t,
      }),
      action: undefined,
      actionText: undefined,
    })),
    Match.exhaustive
  )

  return (
    <Stack>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={() => (
          <NotificationListCardRightSwipeActions
            onPress={() => {
              cancelNotificationCenterRecord(notification.id)
              swipeableRef.current?.close()
            }}
          />
        )}
      >
        <Stack
          marginHorizontal="$5"
          backgroundColor="$backgroundPrimary"
          borderRadius="$5"
        >
          <NotificationCard
            avatar={cardData.avatar}
            name={cardData.name}
            time={formatNotificationTime(notification.date)}
            category={cardData.category}
            message={cardData.message}
            tag={
              notification.status.isSeen ? undefined : (
                <TextTag variant="new" label={t('common.new')} />
              )
            }
          >
            {cardData.action ? (
              <Button
                marginTop="$4"
                variant="secondary"
                size="small"
                onPress={cardData.action}
              >
                {cardData.actionText}
              </Button>
            ) : null}
          </NotificationCard>
        </Stack>
      </Swipeable>
    </Stack>
  )
}

export default NotificationListCard

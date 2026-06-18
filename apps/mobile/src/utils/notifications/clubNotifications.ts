import {ClubUuid, type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {Effect, Schema} from 'effect'
import {AndroidNotificationPriority} from 'expo-notifications'
import {type TFunction} from '../localization/I18nProvider'
import {displayLocalNotification} from './displayLocalNotification'
import {getDefaultChannel} from './notificationChannels'

export class ClubAdmissionInternalNotificationData extends Schema.TaggedClass<ClubAdmissionInternalNotificationData>(
  'ClubAdmissionInternalNotificationData'
)('ClubAdmissionInternalNotificationData', {
  clubUuid: ClubUuid,
}) {
  get encoded(): typeof ClubAdmissionInternalNotificationData.Encoded {
    return Schema.encodeSync(ClubAdmissionInternalNotificationData)(this)
  }
}

export function showInternalNotificationForClubAdmission(
  t: TFunction,
  clubInfo: ClubInfo
): Effect.Effect<void> {
  return Effect.promise(async () => {
    await displayLocalNotification({
      id: `${clubInfo.uuid}-admission`,
      channelId: await getDefaultChannel(),
      content: {
        title: t('clubs.addmittedNotificationText'),
        body: t('clubs.addmittedNotificationTitle', {name: clubInfo.name}),
        data: new ClubAdmissionInternalNotificationData({
          clubUuid: clubInfo.uuid,
        }).encoded,
        priority: AndroidNotificationPriority.HIGH,
      },
    })
  })
}

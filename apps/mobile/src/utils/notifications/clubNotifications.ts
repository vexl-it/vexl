import notifee, {AndroidImportance} from '@notifee/react-native'
import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {type ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Schema} from 'effect'
import {type TFunction} from '../localization/I18nProvider'
import {getDefaultChannel} from './notificationChannels'

export class ClubAdmissionInternalNotificationData extends Schema.TaggedClass<ClubAdmissionInternalNotificationData>(
  'ClubAdmissionInternalNotificationData'
)('ClubAdmissionInternalNotificationData', {
  clubUuid: ClubUuidE,
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
    await notifee.displayNotification({
      id: `${clubInfo.uuid}-admission`,
      title: t('clubs.addmittedNotificationText'),
      body: t('clubs.addmittedNotificationTitle', {name: clubInfo.name}),
      data: new ClubAdmissionInternalNotificationData({
        clubUuid: clubInfo.uuid,
      }).encoded,
      android: {
        lightUpScreen: true,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        channelId: await getDefaultChannel(),
      },
    })
  })
}

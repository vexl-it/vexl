import {type NotificationCategory} from '@vexl-next/analytics-definitions/src/buckets'
import {Option, Record, Schema, pipe} from 'effect'
import {
  CLUB_DEACTIVATED,
  INACTIVITY_REMINDER,
  MARKETPLACE_READY,
  NEW_OFFERS_IN_MARKETPLACE,
} from '../notifications/notificationTypes'

const NotificationData = Schema.Struct({
  _tag: Schema.optional(Schema.String),
  type: Schema.optional(Schema.String),
  inbox: Schema.optional(Schema.String),
  sender: Schema.optional(Schema.String),
})

const categoryByTag: Record<string, NotificationCategory> = {
  VexlProductNotificationData: 'productNews',
  ClubAdmissionInternalNotificationData: 'clubAdmission',
  AdmitedToClubNetworkNotificationData: 'clubAdmission',
  ClubDeactivatedNotificationData: 'clubDeactivated',
  TradeReminderNotificationData: 'tradeReminder',
  NewOffersInternalNotificationData: 'newOffers',
  NewChatMessageNoticeNotificationData: 'chatMessage',
  UserInactivityNotificationData: 'inactivityReminder',
}

const categoryByChatType: Record<string, NotificationCategory> = {
  REQUEST_MESSAGING: 'requestReceived',
  APPROVE_MESSAGING: 'requestAnswered',
  DISAPPROVE_MESSAGING: 'requestAnswered',
}

const categoryByType: Record<string, NotificationCategory> = {
  [NEW_OFFERS_IN_MARKETPLACE]: 'newOffers',
  [MARKETPLACE_READY]: 'marketplaceReady',
  [INACTIVITY_REMINDER]: 'inactivityReminder',
  [CLUB_DEACTIVATED]: 'clubDeactivated',
}

const lookup = (
  categories: Record<string, NotificationCategory>,
  key: string | undefined
): Option.Option<NotificationCategory> =>
  key === undefined ? Option.none() : Record.get(categories, key)

/** Category of an opened notification, read from its data payload. */
export function notificationCategoryFromData(
  data: unknown
): NotificationCategory {
  return pipe(
    Schema.decodeUnknownOption(NotificationData)(data),
    Option.flatMap(({_tag, type, inbox, sender}) =>
      pipe(
        lookup(categoryByTag, _tag),
        Option.orElse(() =>
          inbox !== undefined && sender !== undefined
            ? Option.some(
                Option.getOrElse(
                  lookup(categoryByChatType, type),
                  (): NotificationCategory => 'chatMessage'
                )
              )
            : lookup(categoryByType, type)
        )
      )
    ),
    Option.getOrElse((): NotificationCategory => 'other')
  )
}

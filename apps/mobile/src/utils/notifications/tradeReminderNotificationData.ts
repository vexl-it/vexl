import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Schema} from 'effect'

export class TradeReminderNotificationData extends Schema.TaggedClass<TradeReminderNotificationData>(
  'TradeReminderNotificationData'
)('TradeReminderNotificationData', {
  inbox: PublicKeyPemBase64E,
  sender: PublicKeyPemBase64E,
}) {
  get encoded(): typeof TradeReminderNotificationData.Encoded {
    return Schema.encodeSync(TradeReminderNotificationData)(this)
  }
}

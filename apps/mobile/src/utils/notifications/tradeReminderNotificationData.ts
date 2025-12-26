import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Schema} from 'effect'

export class TradeReminderNotificationData extends Schema.TaggedClass<TradeReminderNotificationData>(
  'TradeReminderNotificationData'
)('TradeReminderNotificationData', {
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
}) {
  get encoded(): typeof TradeReminderNotificationData.Encoded {
    return Schema.encodeSync(TradeReminderNotificationData)(this)
  }
}

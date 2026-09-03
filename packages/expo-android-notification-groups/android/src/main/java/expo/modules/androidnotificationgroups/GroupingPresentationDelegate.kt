package expo.modules.androidnotificationgroups

import android.app.Notification
import android.content.Context
import android.os.Build
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate

// Applies the Android group from the notification data (keys written by
// src/index.ts) to the notification expo-notifications built.
class GroupingPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  @Suppress("DEPRECATION") // pre-O sound/vibrate setters
  override suspend fun createNotification(
    notification: expo.modules.notifications.notifications.model.Notification,
    notificationBehavior: NotificationBehaviorRecord?
  ): Notification {
    val built = super.createNotification(notification, notificationBehavior)
    val data = notification.notificationRequest.content.body ?: return built
    val groupId = data.optString(GROUP_ID_KEY)
    if (groupId.isEmpty()) return built
    val isSummary = data.optBoolean(GROUP_SUMMARY_KEY)

    val builder = Notification.Builder.recoverBuilder(context, built)
      .setGroup(groupId)
      .setGroupSummary(isSummary)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      builder.setGroupAlertBehavior(Notification.GROUP_ALERT_CHILDREN)
    } else if (isSummary) {
      // Pre-O has no group alert behavior; keep the summary silent by hand.
      builder.setSound(null).setVibrate(null).setDefaults(0)
    }
    return builder.build()
  }

  private companion object {
    const val GROUP_ID_KEY = "androidGroupId"
    const val GROUP_SUMMARY_KEY = "androidGroupSummary"
  }
}

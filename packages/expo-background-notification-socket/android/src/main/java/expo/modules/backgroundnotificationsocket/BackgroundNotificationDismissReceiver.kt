package expo.modules.backgroundnotificationsocket

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Android 14+ lets users dismiss the foreground service notification without
// stopping the service; re-post it so the running service stays visible.
class BackgroundNotificationDismissReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (BackgroundNotificationSocketStatus.state == "disabled") return
    BackgroundNotificationSocketService.postNotification(context)
  }
}

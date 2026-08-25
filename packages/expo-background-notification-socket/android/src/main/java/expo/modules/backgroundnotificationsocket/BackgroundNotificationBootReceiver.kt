package expo.modules.backgroundnotificationsocket

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BackgroundNotificationBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED && intent.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    BackgroundNotificationSocketService.startIfEnabled(context)
  }
}

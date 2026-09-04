package expo.modules.androidnotificationpresentation

import android.content.Context
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.PresentationDelegate

class VexlNotificationsService : NotificationsService() {
  override fun getPresentationDelegate(context: Context): PresentationDelegate =
    VexlPresentationDelegate(context)
}

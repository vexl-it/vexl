package expo.modules.backgroundnotificationsocket

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class BackgroundNotificationHeadlessTaskService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val message = intent?.getStringExtra(MESSAGE_EXTRA) ?: return null
    val data = Arguments.createMap().apply { putString("message", message) }

    return HeadlessJsTaskConfig(TASK_NAME, data, TASK_TIMEOUT_MS, true)
  }

  companion object {
    const val MESSAGE_EXTRA = "message"
    private const val TASK_NAME = "VexlBackgroundNotification"
    private const val TASK_TIMEOUT_MS = 60_000L
  }
}

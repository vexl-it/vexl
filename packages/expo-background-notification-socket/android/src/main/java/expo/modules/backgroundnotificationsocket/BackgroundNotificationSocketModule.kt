package expo.modules.backgroundnotificationsocket

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BackgroundNotificationSocketModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundNotificationSocket")

    AsyncFunction("configure") { apiUrl: String, notificationSecret: String, platform: String, version: Int ->
      val context = requireContext()
      BackgroundNotificationConfig.configure(context, apiUrl, notificationSecret, platform, version)

      if (BackgroundNotificationConfig.isEnabled(context)) {
        BackgroundNotificationSocketService.start(context)
      }
    }

    AsyncFunction("clearCredentials") {
      val context = requireContext()
      BackgroundNotificationConfig.clearCredentials(context)
      BackgroundNotificationSocketService.stop(context)
    }

    AsyncFunction("setEnabled") { enabled: Boolean ->
      val context = requireContext()
      BackgroundNotificationConfig.setEnabled(context, enabled)
      if (enabled && BackgroundNotificationConfig.getConfiguration(context) != null) {
        BackgroundNotificationSocketService.start(context)
      } else if (!enabled) {
        BackgroundNotificationSocketService.stop(context)
      }
    }

    AsyncFunction("getEnabledPreference") {
      return@AsyncFunction BackgroundNotificationConfig.getEnabledPreference(requireContext())
    }

    AsyncFunction("requestBatteryExemption") {
      val context = requireContext()
      if (!BackgroundNotificationConfig.isEnabled(context) || isBatteryExempt(context)) {
        return@AsyncFunction null
      }

      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      null
    }

    AsyncFunction("isBatteryExempt") {
      return@AsyncFunction isBatteryExempt(requireContext())
    }

    AsyncFunction("isGmsAvailable") {
      return@AsyncFunction BackgroundNotificationConfig.isGmsAvailable(requireContext())
    }

    AsyncFunction("getState") {
      return@AsyncFunction BackgroundNotificationSocketStatus.state
    }

    AsyncFunction("setForegroundStreamConnected") { connected: Boolean ->
      BackgroundNotificationSocketStatus.foregroundStreamConnected = connected
    }

  }

  private fun requireContext(): Context = requireNotNull(appContext.reactContext?.applicationContext)

  private fun isBatteryExempt(context: Context): Boolean {
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return powerManager.isIgnoringBatteryOptimizations(context.packageName)
  }
}

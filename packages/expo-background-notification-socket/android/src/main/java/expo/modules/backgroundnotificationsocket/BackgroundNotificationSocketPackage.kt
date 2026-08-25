package expo.modules.backgroundnotificationsocket

import android.app.Application
import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

// Discovered by expo-modules-autolinking through the *Package.kt filename
// convention; the class name must match the file name.
class BackgroundNotificationSocketPackage : Package {
  override fun createApplicationLifecycleListeners(
    context: Context,
  ): List<ApplicationLifecycleListener> = listOf(
    object : ApplicationLifecycleListener {
      // Restart the socket service on every process start (app launch, sticky
      // restart, ...) without depending on the JS runtime coming up.
      override fun onCreate(application: Application) {
        BackgroundNotificationSocketService.startIfEnabled(application)
      }
    },
  )
}

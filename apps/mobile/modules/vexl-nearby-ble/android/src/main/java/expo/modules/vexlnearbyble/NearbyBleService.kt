package expo.modules.vexlnearbyble

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Keeps the process in the foreground while advertising or scanning is requested, so
 * both keep running with the app in the background. The BLE work itself lives
 * in NearbyBle.
 */
class NearbyBleService : Service() {
  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  // Every startForegroundService must be answered by startForeground, even when
  // NearbyBle went inactive meanwhile, or Android crashes the app.
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    inForeground = enterForeground()
    if (!inForeground || !NearbyBle.isActive) stopSelf()
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    inForeground = false
    super.onDestroy()
  }

  // Without JS nobody consumes discovered keys or updates advertised ones.
  override fun onTaskRemoved(rootIntent: Intent?) {
    NearbyBle.stopAll()
    super.onTaskRemoved(rootIntent)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun enterForeground(): Boolean = try {
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      buildNotification(this),
      ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
    )
    true
  } catch (exception: Exception) {
    // Started from the background (API 31+) or without a Bluetooth permission (API 34+).
    Log.w(LOG_TAG, "Unable to enter the foreground: ${exception.javaClass.simpleName}")
    false
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    getSystemService(NotificationManager::class.java).createNotificationChannel(
      NotificationChannel(
        CHANNEL_ID,
        getString(R.string.vexl_nearby_ble_notification_channel),
        NotificationManager.IMPORTANCE_LOW,
      ),
    )
  }

  companion object {
    private const val LOG_TAG = "VexlNearbyBle"
    private const val CHANNEL_ID = "vexl_nearby_ble"
    private const val NOTIFICATION_ID = 240

    // Stopping a service that has not called startForeground yet crashes the app;
    // a pending start stops itself in onStartCommand instead.
    private var inForeground = false

    /** Runs the service exactly while advertising or scanning is requested. */
    fun sync(context: Context) {
      val intent = Intent(context, NearbyBleService::class.java)
      if (!NearbyBle.isActive) {
        if (inForeground) context.stopService(intent)
        return
      }
      // Updates the title when the service is already running.
      if (inForeground) {
        context.getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(context))
      }
      try {
        ContextCompat.startForegroundService(context, intent)
      } catch (exception: IllegalStateException) {
        // ForegroundServiceStartNotAllowedException: BLE still runs while the app is visible.
        Log.w(LOG_TAG, "Unable to start foreground service: ${exception.javaClass.simpleName}")
      }
    }

    private fun buildNotification(context: Context): Notification =
      NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(notificationIcon(context))
        .setContentTitle(context.getString(notificationTitle()))
        .setContentIntent(openAppIntent(context))
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build()

    private fun notificationTitle(): Int =
      if (NearbyBle.isSharing) {
        R.string.vexl_nearby_ble_notification_sharing_title
      } else {
        R.string.vexl_nearby_ble_notification_looking_title
      }

    private fun openAppIntent(context: Context): PendingIntent? =
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
        PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE)
      }

    private fun notificationIcon(context: Context): Int {
      val icon = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
      return if (icon != 0) icon else context.applicationInfo.icon
    }
  }
}

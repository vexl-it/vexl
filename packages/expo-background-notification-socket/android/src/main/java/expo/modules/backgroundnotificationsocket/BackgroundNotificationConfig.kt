package expo.modules.backgroundnotificationsocket

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

internal data class SocketConfiguration(
  val apiUrl: String,
  val notificationSecret: String,
  val platform: String,
  val version: Int,
)

internal object BackgroundNotificationConfig {
  private const val PREFERENCES_NAME = "vexl_background_notification_socket"
  private const val API_URL = "api_url"
  private const val NOTIFICATION_SECRET = "notification_secret"
  private const val PLATFORM = "platform"
  private const val VERSION = "version"
  private const val ENABLED = "enabled"

  @Volatile private var cachedPreferences: SharedPreferences? = null

  @Synchronized
  private fun preferences(context: Context): SharedPreferences =
    cachedPreferences ?: try {
      createPreferences(context)
    } catch (_: Exception) {
      // The file cannot be decrypted anymore (restored backup, keystore reset):
      // the configuration is lost either way, start over with a fresh file.
      context.deleteSharedPreferences(PREFERENCES_NAME)
      createPreferences(context)
    }.also { cachedPreferences = it }

  private fun createPreferences(context: Context): SharedPreferences {
    val masterKey = MasterKey.Builder(context)
      .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
      .build()

    return EncryptedSharedPreferences.create(
      context,
      PREFERENCES_NAME,
      masterKey,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )
  }

  fun configure(
    context: Context,
    apiUrl: String,
    notificationSecret: String,
    platform: String,
    version: Int,
  ) {
    preferences(context).edit()
      .putString(API_URL, apiUrl)
      .putString(NOTIFICATION_SECRET, notificationSecret)
      .putString(PLATFORM, platform)
      .putInt(VERSION, version)
      .apply()
  }

  // Logout: wipe the credentials and the enabled decision so the next login
  // starts from the undecided state again.
  fun clearCredentials(context: Context) {
    preferences(context).edit().clear().apply()
  }

  fun getConfiguration(context: Context): SocketConfiguration? {
    val preferences = preferences(context)
    val apiUrl = preferences.getString(API_URL, null) ?: return null
    val notificationSecret = preferences.getString(NOTIFICATION_SECRET, null) ?: return null
    val platform = preferences.getString(PLATFORM, null) ?: return null
    val version = preferences.getInt(VERSION, -1)
    if (version < 0) return null

    return SocketConfiguration(apiUrl, notificationSecret, platform, version)
  }

  fun isEnabled(context: Context): Boolean = getEnabledPreference(context) == true

  // null until the user decided (JS offers the channel on devices without Google services)
  fun getEnabledPreference(context: Context): Boolean? {
    val preferences = preferences(context)
    return if (preferences.contains(ENABLED)) preferences.getBoolean(ENABLED, false) else null
  }

  fun setEnabled(context: Context, enabled: Boolean) {
    preferences(context).edit().putBoolean(ENABLED, enabled).apply()
  }

  fun isGmsAvailable(context: Context): Boolean = try {
    val applicationInfo = context.packageManager.getApplicationInfo("com.google.android.gms", 0)
    applicationInfo.enabled && applicationInfo.flags and ApplicationInfo.FLAG_INSTALLED != 0
  } catch (_: Exception) {
    false
  }
}

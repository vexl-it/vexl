package expo.modules.androidnotificationpresentation

import android.app.Notification
import android.app.Person
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.util.Base64
import android.util.Log
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.caverock.androidsvg.SVG
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import org.json.JSONArray
import org.json.JSONObject

// Applies Android-only presentation read from the notification data (keys
// written by src/index.ts) to the notification expo-notifications built:
// notification groups and conversation (MessagingStyle) rendering.
class VexlPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  override suspend fun createNotification(
    notification: expo.modules.notifications.notifications.model.Notification,
    notificationBehavior: NotificationBehaviorRecord?
  ): Notification {
    val built = super.createNotification(notification, notificationBehavior)
    val data = notification.notificationRequest.content.body ?: return built
    val groupId = data.optString(GROUP_ID_KEY)
    val conversation = data.optJSONObject(CONVERSATION_KEY)
    if (groupId.isEmpty() && conversation == null) return built

    val builder = Notification.Builder.recoverBuilder(context, built)
    if (groupId.isNotEmpty()) applyGroup(builder, groupId, data.optBoolean(GROUP_SUMMARY_KEY))
    if (conversation != null) {
      applyConversation(builder, notification.notificationRequest.identifier, conversation)
    }
    return builder.build()
  }

  // Conversation shortcuts live only as long as their notification.
  override fun dismissNotifications(identifiers: Collection<String>) {
    super.dismissNotifications(identifiers)
    ShortcutManagerCompat.removeLongLivedShortcuts(context, identifiers.toList())
  }

  override fun dismissAllNotifications() {
    super.dismissAllNotifications()
    ShortcutManagerCompat.removeAllDynamicShortcuts(context)
  }

  @Suppress("DEPRECATION") // pre-O sound/vibrate setters
  private fun applyGroup(builder: Notification.Builder, groupId: String, isSummary: Boolean) {
    builder.setGroup(groupId).setGroupSummary(isSummary)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      builder.setGroupAlertBehavior(Notification.GROUP_ALERT_CHILDREN)
    } else if (isSummary) {
      // Pre-O has no group alert behavior; keep the summary silent by hand.
      builder.setSound(null).setVibrate(null).setDefaults(0)
    }
  }

  private fun applyConversation(
    builder: Notification.Builder,
    conversationId: String,
    conversation: JSONObject
  ) {
    val senderName = conversation.getString(SENDER_NAME_KEY)
    val avatar = conversation.optJSONObject(AVATAR_KEY)?.let { loadAvatar(it) }
    val messages = conversation.getJSONArray(MESSAGES_KEY)
    builder.setCategory(Notification.CATEGORY_MESSAGE)
    val style = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val sender = Person.Builder()
        .setKey(conversationId)
        .setName(senderName)
        .setIcon(avatar?.let { Icon.createWithBitmap(it) })
        .build()
      // The style's user is the device owner. Their name only shows on outgoing
      // messages, which are never posted, so any non-empty value works.
      Notification.MessagingStyle(Person.Builder().setName(SELF_NAME).build())
        .setGroupConversation(false)
        .also { style ->
          forEachMessage(messages) { text, timestamp ->
            style.addMessage(Notification.MessagingStyle.Message(text, timestamp, sender))
          }
        }
    } else {
      // Per-sender icons need API 28; show the avatar as the large icon instead.
      avatar?.let { builder.setLargeIcon(it) }
      @Suppress("DEPRECATION")
      Notification.MessagingStyle(SELF_NAME).also { style ->
        forEachMessage(messages) { text, timestamp -> style.addMessage(text, timestamp, senderName) }
      }
    }
    builder.setStyle(style)

    // Android 11+ only uses its conversation layout (avatar in the collapsed
    // row, "Conversations" section) when the notification references a
    // long-lived shortcut for the chat.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      publishConversationShortcut(conversationId, senderName, avatar)
      builder.setShortcutId(conversationId)
    }
  }

  private fun publishConversationShortcut(id: String, senderName: String, avatar: Bitmap?) {
    pruneStaleConversationShortcuts(keep = id)
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    val icon = avatar?.let { IconCompat.createWithBitmap(it) }
    val person = androidx.core.app.Person.Builder()
      .setKey(id)
      .setName(senderName)
      .setIcon(icon)
      .build()
    val shortcut = ShortcutInfoCompat.Builder(context, id)
      .setShortLabel(senderName)
      .setIcon(icon)
      .setPerson(person)
      .setLongLived(true)
      // Not excluded from the launcher: the shortcut service only keeps
      // launcher-excluded shortcuts in AppSearch, which is off by default, so
      // they would vanish and Android would not treat the chat as a conversation.
      .setIntent(launchIntent)
      .build()
    ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
  }

  // Shortcuts of notifications the user swiped away are not removed through
  // dismissNotifications, so drop any without an active notification.
  private fun pruneStaleConversationShortcuts(keep: String) {
    val active = getAllPresentedNotifications().map { it.notificationRequest.identifier }.toSet() + keep
    val stale = ShortcutManagerCompat.getDynamicShortcuts(context).map { it.id }.filter { it !in active }
    if (stale.isNotEmpty()) ShortcutManagerCompat.removeLongLivedShortcuts(context, stale)
  }

  private fun forEachMessage(messages: JSONArray, block: (text: String, timestamp: Long) -> Unit) {
    for (i in 0 until messages.length()) {
      val message = messages.getJSONObject(i)
      block(message.getString(MESSAGE_TEXT_KEY), message.getLong(MESSAGE_TIMESTAMP_KEY))
    }
  }

  private fun loadAvatar(avatar: JSONObject): Bitmap? = try {
    when (avatar.getString(AVATAR_TYPE_KEY)) {
      AVATAR_TYPE_SVG -> renderSvg(avatar.getString(AVATAR_SVG_KEY))
      AVATAR_TYPE_URI -> decodeImageUri(avatar.getString(AVATAR_URI_KEY))
      else -> null
    }
  } catch (e: Exception) {
    Log.w(TAG, "Could not load conversation avatar", e)
    null
  }

  private fun renderSvg(svgXml: String): Bitmap {
    val svg = SVG.getFromString(svgXml)
    svg.setDocumentWidth(AVATAR_SIZE_PX.toFloat())
    svg.setDocumentHeight(AVATAR_SIZE_PX.toFloat())
    val bitmap = Bitmap.createBitmap(AVATAR_SIZE_PX, AVATAR_SIZE_PX, Bitmap.Config.ARGB_8888)
    svg.renderToCanvas(Canvas(bitmap))
    return bitmap
  }

  // Decodes a data:, file: or content: URI, downsampled so the notification stays small.
  private fun decodeImageUri(uri: String): Bitmap? {
    val readBytes: () -> ByteArray? = if (uri.startsWith("data:")) {
      { Base64.decode(uri.substringAfter(","), Base64.DEFAULT) }
    } else {
      { context.contentResolver.openInputStream(Uri.parse(uri))?.use { it.readBytes() } }
    }
    val bytes = readBytes() ?: return null

    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    val options = BitmapFactory.Options().apply {
      inSampleSize = 1
      while (bounds.outWidth / (inSampleSize * 2) >= AVATAR_SIZE_PX &&
        bounds.outHeight / (inSampleSize * 2) >= AVATAR_SIZE_PX
      ) {
        inSampleSize *= 2
      }
    }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
  }

  private companion object {
    const val TAG = "VexlNotifications"
    const val GROUP_ID_KEY = "androidGroupId"
    const val GROUP_SUMMARY_KEY = "androidGroupSummary"
    const val CONVERSATION_KEY = "androidConversation"
    const val SENDER_NAME_KEY = "senderName"
    const val AVATAR_KEY = "avatar"
    const val AVATAR_TYPE_KEY = "type"
    const val AVATAR_TYPE_SVG = "svgXml"
    const val AVATAR_SVG_KEY = "svgXml"
    const val AVATAR_TYPE_URI = "imageUri"
    const val AVATAR_URI_KEY = "imageUri"
    const val MESSAGES_KEY = "messages"
    const val MESSAGE_TEXT_KEY = "text"
    const val MESSAGE_TIMESTAMP_KEY = "timestamp"
    const val SELF_NAME = "me"
    const val AVATAR_SIZE_PX = 256
  }
}

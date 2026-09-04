package expo.modules.androidnotificationpresentation

import android.app.Notification
import android.app.Person
import android.content.Context
import android.graphics.drawable.Icon
import android.os.Build
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
    val shortcut = ConversationShortcut(
      id = conversationId,
      name = conversation.getString(SENDER_NAME_KEY),
      url = conversation.getString(URL_KEY),
      avatar = conversation.optJSONObject(AVATAR_KEY)?.let {
        val type = it.getString(AVATAR_TYPE_KEY)
        ConversationAvatar(type, it.getString(type))
      }
    )
    val avatar = ConversationShortcuts.loadAvatar(context, shortcut.avatar)
    val messages = conversation.getJSONArray(MESSAGES_KEY)
    builder.setCategory(Notification.CATEGORY_MESSAGE)
    val style = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val sender = Person.Builder()
        .setKey(conversationId)
        .setName(shortcut.name)
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
        forEachMessage(messages) { text, timestamp -> style.addMessage(text, timestamp, shortcut.name) }
      }
    }
    builder.setStyle(style)

    // Android 11+ only uses its conversation layout (avatar in the collapsed
    // row, "Conversations" section) when the notification references a
    // long-lived shortcut for the chat. JS keeps the full list in sync; this
    // makes sure the chat's shortcut exists and is current when the
    // notification is shown, e.g. from the background.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      ConversationShortcuts.push(context, shortcut, rank = 0, avatar = avatar)
      builder.setShortcutId(conversationId)
    }
  }

  private fun forEachMessage(messages: JSONArray, block: (text: String, timestamp: Long) -> Unit) {
    for (i in 0 until messages.length()) {
      val message = messages.getJSONObject(i)
      block(message.getString(MESSAGE_TEXT_KEY), message.getLong(MESSAGE_TIMESTAMP_KEY))
    }
  }

  private companion object {
    const val GROUP_ID_KEY = "androidGroupId"
    const val GROUP_SUMMARY_KEY = "androidGroupSummary"
    const val CONVERSATION_KEY = "androidConversation"
    const val SENDER_NAME_KEY = "senderName"
    const val URL_KEY = "url"
    const val AVATAR_KEY = "avatar"
    const val AVATAR_TYPE_KEY = "type"
    const val MESSAGES_KEY = "messages"
    const val MESSAGE_TEXT_KEY = "text"
    const val MESSAGE_TIMESTAMP_KEY = "timestamp"
    const val SELF_NAME = "me"
  }
}

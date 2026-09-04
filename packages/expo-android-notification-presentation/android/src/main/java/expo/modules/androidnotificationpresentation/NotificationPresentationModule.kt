package expo.modules.androidnotificationpresentation

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ConversationShortcutRecord : Record {
  @Field val id: String = ""
  @Field val name: String = ""
  @Field val url: String = ""
  @Field val avatar: Map<String, String>? = null
}

class NotificationPresentationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAndroidNotificationPresentation")

    AsyncFunction("setConversationShortcuts") { shortcuts: List<ConversationShortcutRecord> ->
      ConversationShortcuts.setAll(
        appContext.reactContext ?: throw Exceptions.ReactContextLost(),
        shortcuts.map { record ->
          ConversationShortcut(
            id = record.id,
            name = record.name,
            url = record.url,
            avatar = record.avatar?.let { avatar ->
              val type = avatar["type"] ?: return@let null
              avatar[type]?.let { ConversationAvatar(type, it) }
            }
          )
        }
      )
    }
  }
}

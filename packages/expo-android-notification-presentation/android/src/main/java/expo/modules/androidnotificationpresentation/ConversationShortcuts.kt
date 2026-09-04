package expo.modules.androidnotificationpresentation

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.net.Uri
import android.util.Base64
import android.util.Log
import androidx.core.app.Person
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.caverock.androidsvg.SVG

// Sender avatar as sent from JS: inline SVG markup or a data:/file:/content: URI.
class ConversationAvatar(val type: String, val value: String) {
  companion object {
    const val TYPE_SVG = "svgXml"
    const val TYPE_URI = "imageUri"
  }
}

class ConversationShortcut(
  val id: String,
  val name: String,
  val url: String,
  val avatar: ConversationAvatar?
)

// Long-lived shortcuts, one per chat, opening the chat through its deep link.
// They double as launcher shortcuts and as the conversation reference Android
// 11+ needs to render chat notifications with its conversation layout.
object ConversationShortcuts {
  private const val TAG = "VexlNotifications"
  private const val AVATAR_SIZE_PX = 256

  // Replaces the published list; ranks follow the list order.
  fun setAll(context: Context, shortcuts: List<ConversationShortcut>) {
    val wanted = shortcuts.map { it.id }.toSet()
    val stale = ShortcutManagerCompat.getDynamicShortcuts(context).map { it.id }.filter { it !in wanted }
    if (stale.isNotEmpty()) ShortcutManagerCompat.removeLongLivedShortcuts(context, stale)
    shortcuts.forEachIndexed { rank, shortcut -> push(context, shortcut, rank, loadAvatar(context, shortcut.avatar)) }
  }

  fun push(context: Context, shortcut: ConversationShortcut, rank: Int, avatar: Bitmap?) {
    val icon = avatar?.let { IconCompat.createWithBitmap(it) }
    val person = Person.Builder().setKey(shortcut.id).setName(shortcut.name).setIcon(icon).build()
    val info = ShortcutInfoCompat.Builder(context, shortcut.id)
      .setShortLabel(shortcut.name)
      .setIcon(icon)
      .setPerson(person)
      .setLongLived(true)
      .setRank(rank)
      // Not excluded from the launcher: the shortcut service only keeps
      // launcher-excluded shortcuts in AppSearch, which is off by default, so
      // they would vanish and Android would not treat the chat as a conversation.
      .setIntent(Intent(Intent.ACTION_VIEW, Uri.parse(shortcut.url)).setPackage(context.packageName))
      .build()
    ShortcutManagerCompat.pushDynamicShortcut(context, info)
  }

  fun loadAvatar(context: Context, avatar: ConversationAvatar?): Bitmap? = try {
    when (avatar?.type) {
      ConversationAvatar.TYPE_SVG -> renderSvg(avatar.value)
      ConversationAvatar.TYPE_URI -> decodeImageUri(context, avatar.value)
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

  // Downsampled so notifications and the shortcut store stay small.
  private fun decodeImageUri(context: Context, uri: String): Bitmap? {
    val bytes = if (uri.startsWith("data:")) {
      Base64.decode(uri.substringAfter(","), Base64.DEFAULT)
    } else {
      context.contentResolver.openInputStream(Uri.parse(uri))?.use { it.readBytes() }
    } ?: return null

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
}

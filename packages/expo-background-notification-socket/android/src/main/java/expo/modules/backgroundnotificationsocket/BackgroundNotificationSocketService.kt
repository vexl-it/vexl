package expo.modules.backgroundnotificationsocket

import android.app.ActivityManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.math.min
import kotlin.random.Random

internal object BackgroundNotificationSocketStatus {
  @Volatile var state: String = "disabled"

  // Kept up to date by JS around the foreground socket's lifetime. Messages
  // may only be dropped when the foreground socket really has its own copy.
  @Volatile var foregroundStreamConnected: Boolean = false
}

class BackgroundNotificationSocketService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val httpClient = OkHttpClient.Builder()
    .pingInterval(20, TimeUnit.SECONDS)
    .build()
  private val connectivityManager by lazy {
    getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
  }
  private var socket: WebSocket? = null
  private var connectedConfiguration: SocketConfiguration? = null
  private var reconnectAttempt = 0
  private var stopped = false
  private var networkCallbackRegistered = false

  private val reconnectRunnable = Runnable { connect() }
  private val pingRunnable = object : Runnable {
    override fun run() {
      socket?.send(JSONObject().put("_tag", "Ping").toString() + "\n")
      handler.postDelayed(this, PING_INTERVAL_MS)
    }
  }

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: Network) {
      handler.post {
        if (socket == null && !stopped) scheduleReconnect(0)
      }
    }

    override fun onLost(network: Network) {
      handler.post {
        if (!hasNetwork()) {
          socket?.cancel()
          socket = null
          // Fallback poll in case the onAvailable callback is missed.
          scheduleReconnect(MAX_RECONNECT_DELAY_MS)
        }
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    stopped = false
    createNotificationChannel()
    try {
      ServiceCompat.startForeground(
        this,
        NOTIFICATION_ID,
        foregroundNotification(),
        ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING,
      )
    } catch (exception: Exception) {
      // ForegroundServiceStartNotAllowedException on API 31+: the next allowed
      // start (app launch, boot, sticky restart) brings the service back.
      Log.w(LOG_TAG, "Unable to enter the foreground: ${exception.javaClass.simpleName}")
      stopSelf()
      return
    }
    connectivityManager.registerDefaultNetworkCallback(networkCallback)
    networkCallbackRegistered = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (!BackgroundNotificationConfig.isEnabled(this)) {
      stopSelf()
      return START_NOT_STICKY
    }

    val configuration = BackgroundNotificationConfig.getConfiguration(this)
    if (configuration == null) {
      BackgroundNotificationSocketStatus.state = "waiting_for_configuration"
      stopSelf()
      return START_NOT_STICKY
    }

    if (socket != null && connectedConfiguration != configuration) {
      socket?.cancel()
      socket = null
    }

    scheduleReconnect(0)
    return START_STICKY
  }

  override fun onDestroy() {
    stopped = true
    handler.removeCallbacksAndMessages(null)
    socket?.close(1000, "service stopped")
    socket = null
    httpClient.dispatcher.executorService.shutdown()
    if (networkCallbackRegistered) connectivityManager.unregisterNetworkCallback(networkCallback)
    BackgroundNotificationSocketStatus.state = "disabled"
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun connect() {
    handler.removeCallbacks(reconnectRunnable)
    if (stopped || socket != null) return
    if (!hasNetwork()) {
      // Fallback poll in case the onAvailable callback is missed.
      handler.postDelayed(reconnectRunnable, MAX_RECONNECT_DELAY_MS)
      return
    }

    val configuration = BackgroundNotificationConfig.getConfiguration(this) ?: run {
      BackgroundNotificationSocketStatus.state = "waiting_for_configuration"
      return
    }

    BackgroundNotificationSocketStatus.state = if (reconnectAttempt == 0) "connecting" else "reconnecting"
    val request = Request.Builder().url(toSocketUrl(configuration.apiUrl)).build()
    connectedConfiguration = configuration
    socket = httpClient.newWebSocket(request, listener(configuration))
  }

  private fun listener(configuration: SocketConfiguration): WebSocketListener =
    object : WebSocketListener() {
      override fun onOpen(webSocket: WebSocket, response: Response) {
        Log.i(LOG_TAG, "Background notification socket connected")
        handler.post {
          if (socket != webSocket) return@post
          BackgroundNotificationSocketStatus.state = "connected"
          webSocket.send(requestFrame(configuration))
          handler.removeCallbacks(pingRunnable)
          handler.postDelayed(pingRunnable, PING_INTERVAL_MS)
          // Only a connection that survives for a while resets the backoff;
          // resetting on open would turn a server that accepts and immediately
          // drops connections into a tight reconnect loop.
          handler.postDelayed({
            if (socket == webSocket) reconnectAttempt = 0
          }, BACKOFF_RESET_AFTER_MS)
        }
      }

      override fun onMessage(webSocket: WebSocket, text: String) {
        handler.post {
          if (socket != webSocket) return@post
          text.lineSequence().filter { it.isNotBlank() }.forEach(::handleFrame)
        }
      }

      override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
        onMessage(webSocket, bytes.utf8())
      }

      override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
        webSocket.close(code, reason)
      }

      override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        handler.post {
          if (socket == webSocket) {
            socket = null
            scheduleReconnect()
          }
        }
      }

      override fun onFailure(webSocket: WebSocket, throwable: Throwable, response: Response?) {
        Log.w(
          LOG_TAG,
          "Background notification socket failed (${response?.code}): ${throwable.javaClass.simpleName}",
        )
        handler.post {
          if (socket == webSocket) {
            socket = null
            scheduleReconnect()
          }
        }
      }
    }

  private fun handleFrame(frame: String) {
    val message = try {
      JSONObject(frame)
    } catch (_: Exception) {
      socket?.cancel()
      socket = null
      scheduleReconnect()
      return
    }

    when (message.optString("_tag")) {
      "Chunk" -> {
        val requestId = message.optString("requestId", REQUEST_ID)
        socket?.send(ackFrame(requestId))
        val values = message.optJSONArray("values") ?: return
        // Drop only when the foreground JS socket received its own copy from
        // the server; process importance alone is not enough (the activity is
        // already foreground while the JS socket is still connecting).
        if (isAppInForeground() && BackgroundNotificationSocketStatus.foregroundStreamConnected) return
        for (index in 0 until values.length()) {
          val value = values.optJSONObject(index) ?: continue
          if (value.optString("_tag") != "DebugMessage") startHeadlessTask(value.toString())
        }
      }
      "Exit", "Defect", "ClientProtocolError" -> {
        socket?.cancel()
        socket = null
        scheduleReconnect()
      }
    }
  }

  // With the foreground service running the process importance never drops
  // below FOREGROUND_SERVICE, so FOREGROUND means a resumed activity.
  private fun isAppInForeground(): Boolean {
    val processInfo = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(processInfo)
    return processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
  }

  private fun startHeadlessTask(message: String) {
    HeadlessJsTaskService.acquireWakeLockNow(this)
    val intent = Intent(this, BackgroundNotificationHeadlessTaskService::class.java)
      .putExtra(BackgroundNotificationHeadlessTaskService.MESSAGE_EXTRA, message)
    startService(intent)
  }

  private fun scheduleReconnect(delayMs: Long = nextReconnectDelayMs()) {
    handler.removeCallbacks(pingRunnable)
    handler.removeCallbacks(reconnectRunnable)
    if (stopped || !BackgroundNotificationConfig.isEnabled(this)) return

    BackgroundNotificationSocketStatus.state = "reconnecting"
    handler.postDelayed(reconnectRunnable, delayMs)
  }

  private fun nextReconnectDelayMs(): Long {
    val exponent = min(reconnectAttempt, MAX_BACKOFF_EXPONENT)
    reconnectAttempt += 1
    val delay = min(INITIAL_RECONNECT_DELAY_MS shl exponent, MAX_RECONNECT_DELAY_MS)
    // Jitter avoids synchronized reconnect storms after a server restart.
    return delay / 2 + Random.nextLong(delay / 2 + 1)
  }

  private fun hasNetwork(): Boolean {
    val network = connectivityManager.activeNetwork ?: return false
    val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
  }

  private fun requestFrame(configuration: SocketConfiguration): String {
    val payload = JSONObject()
      .put("version", configuration.version)
      .put("notificationToken", configuration.notificationSecret)
      .put("platform", configuration.platform)
      .put("connectionKind", "background")
    return JSONObject()
      .put("_tag", "Request")
      .put("id", REQUEST_ID)
      .put("tag", "listenToNotifications")
      .put("payload", payload)
      .put("headers", org.json.JSONArray())
      .toString() + "\n"
  }

  private fun ackFrame(requestId: String): String = JSONObject()
    .put("_tag", "Ack")
    .put("requestId", requestId)
    .toString() + "\n"

  private fun toSocketUrl(apiUrl: String): String {
    val baseUrl = apiUrl.trimEnd('/')
    val socketBase = when {
      baseUrl.startsWith("https://") -> "wss://${baseUrl.removePrefix("https://")}"
      baseUrl.startsWith("http://") -> "ws://${baseUrl.removePrefix("http://")}"
      else -> baseUrl
    }
    return "$socketBase/rpc"
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.createNotificationChannel(
      NotificationChannel(
        CHANNEL_ID,
        getString(R.string.vexl_background_notification_channel),
        NotificationManager.IMPORTANCE_LOW,
      ),
    )
  }

  private fun foregroundNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
    .setSmallIcon(notificationIcon())
    .setContentTitle(getString(R.string.vexl_background_notification_title))
    .setContentText(getString(R.string.vexl_background_notification_body))
    .setOngoing(true)
    .setPriority(NotificationCompat.PRIORITY_LOW)
    .build()

  private fun notificationIcon(): Int {
    val notificationIcon = resources.getIdentifier("notification_icon", "drawable", packageName)
    return if (notificationIcon != 0) notificationIcon else applicationInfo.icon
  }

  companion object {
    private const val LOG_TAG = "VexlBackgroundSocket"
    private const val CHANNEL_ID = "vexl_background_notification_socket"
    private const val NOTIFICATION_ID = 239
    private const val REQUEST_ID = "0"
    private const val PING_INTERVAL_MS = 20_000L
    private const val INITIAL_RECONNECT_DELAY_MS = 1_000L
    private const val MAX_RECONNECT_DELAY_MS = 60_000L
    private const val MAX_BACKOFF_EXPONENT = 6
    private const val BACKOFF_RESET_AFTER_MS = 30_000L

    fun start(context: Context) {
      try {
        ContextCompat.startForegroundService(
          context,
          Intent(context, BackgroundNotificationSocketService::class.java),
        )
      } catch (exception: IllegalStateException) {
        // ForegroundServiceStartNotAllowedException on API 31+: the next
        // allowed start (app launch, boot, sticky restart) brings it back.
        Log.w(LOG_TAG, "Unable to start foreground service: ${exception.javaClass.simpleName}")
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, BackgroundNotificationSocketService::class.java))
      BackgroundNotificationSocketStatus.state = "disabled"
    }

    fun startIfEnabled(context: Context) {
      if (!BackgroundNotificationConfig.isEnabled(context)) return
      if (BackgroundNotificationConfig.getConfiguration(context) == null) return
      start(context)
    }
  }
}
